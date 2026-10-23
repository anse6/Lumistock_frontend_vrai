import { useEffect, useState } from 'react';
import { getCountries, getCountryCallingCode } from 'react-phone-number-input';
import { getUrlServer } from '../../../configServer';

export type CountryOption = {
  code: string;
  name: string;
  callingCode: string;
  flag: string;
};

const countryNames = new Intl.DisplayNames(['fr'], { type: 'region' });

const flagForCountry = (countryCode: string) =>
  String.fromCodePoint(...countryCode.toUpperCase().split('').map((char) => 127397 + char.charCodeAt(0)));

export const countryOptions: CountryOption[] = getCountries()
  .map((code) => ({
    code,
    name: countryNames.of(code) ?? code,
    callingCode: `+${getCountryCallingCode(code)}`,
    flag: flagForCountry(code),
  }))
  .sort((left, right) => left.name.localeCompare(right.name, 'fr'));

export const findCountryOption = (countryCode?: string) =>
  countryOptions.find((country) => country.code === countryCode);

export const legalEntityOptions = [
  'Entreprise individuelle',
  'Auto-entrepreneur',
  'SARL',
  'SARLU / EURL',
  'SA',
  'SAS',
  'SASU',
  'SNC',
  'SCS',
  'Coopérative',
  'Association',
  'ONG',
  'Autre',
].map((value) => ({ value, label: value }));

const normalizeName = (name: string) =>
  name.normalize('NFD').replace(/[\u0300-\u036f]/g, '').trim().toLowerCase();

// Fusionne plusieurs listes de villes sans doublons (« Yaounde » = « Yaoundé »).
// Les premières listes sont prioritaires pour l'orthographe retenue.
const mergeCityLists = (...lists: string[][]) => {
  const byKey = new Map<string, string>();
  lists.flat().forEach((city) => {
    const key = normalizeName(city);
    if (key && !byKey.has(key)) byKey.set(key, city.trim());
  });
  // Ordre du serveur conservé (grandes villes d'abord : Yaoundé, Douala…) ;
  // les villes du référentiel mondial absentes suivent, par ordre alphabétique.
  const local = new Set(lists[0]?.map(normalizeName) ?? []);
  const valeurs = Array.from(byKey.entries());
  const duServeur = valeurs.filter(([key]) => local.has(key)).map(([, city]) => city);
  const autres = valeurs.filter(([key]) => !local.has(key)).map(([, city]) => city);
  return [...duServeur, ...autres.sort((left, right) => left.localeCompare(right, 'fr'))];
};

export const useCitiesForCountry = (countryCode?: string) => {
  const [cities, setCities] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    let cancelled = false;
    if (!countryCode) {
      setCities([]);
      return undefined;
    }

    setCities([]);
    setIsLoading(true);

    // Base locale du backend (villes avec quartiers référencés) : prioritaire.
    const query = new URLSearchParams({ country_code: countryCode });
    const apiCities = fetch(`${getUrlServer()}/locations/cities?${query}`)
      .then((response) => (response.ok ? response.json() : []))
      .then((data: unknown) => (Array.isArray(data) ? data.filter((city): city is string => typeof city === 'string') : []))
      .catch(() => [] as string[]);

    // Référentiel mondial (tous les pays) : chargé à la demande dans un chunk
    // séparé, pour que chaque pays sélectionné propose ses villes.
    const worldCities = import('country-state-city')
      .then(({ City }) => (City.getCitiesOfCountry(countryCode) ?? []).map((city) => city.name))
      .catch(() => [] as string[]);

    void Promise.all([apiCities, worldCities])
      .then(([local, world]) => {
        if (!cancelled) setCities(mergeCityLists(local, world));
      })
      .finally(() => {
        if (!cancelled) setIsLoading(false);
      });

    return () => { cancelled = true; };
  }, [countryCode]);

  return { cities, isLoading };
};

export const useNeighborhoodsForCity = (countryCode?: string, city?: string) => {
  const [neighborhoods, setNeighborhoods] = useState<string[]>([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    if (!countryCode || !city) {
      setNeighborhoods([]);
      return () => controller.abort();
    }

    setNeighborhoods([]);
    setIsLoading(true);
    const query = new URLSearchParams({ country_code: countryCode, city });
    void fetch(`${getUrlServer()}/locations/neighborhoods?${query}`, { signal: controller.signal })
      .then((response) => response.ok ? response.json() : [])
      .then((data: unknown) => {
        if (!controller.signal.aborted) {
          setNeighborhoods(Array.isArray(data) ? data : []);
        }
      })
      .catch(() => {
        if (!controller.signal.aborted) setNeighborhoods([]);
      })
      .finally(() => {
        if (!controller.signal.aborted) setIsLoading(false);
      });

    return () => controller.abort();
  }, [countryCode, city]);

  return { neighborhoods, isLoading };
};
