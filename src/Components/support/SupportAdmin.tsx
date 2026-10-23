// Page « Support Lumistock » de l'espace admin : réservée à l'administrateur du
// magasin (un manager voit un message d'explication).
import React from "react";
import { Result } from "antd";
import MessagerieSupport from "./MessagerieSupport";

const SupportAdmin: React.FC = () =>
  localStorage.getItem("role") === "admin" ? (
    <MessagerieSupport cote="admin" />
  ) : (
    <Result status="info" title="Réservé à l'administrateur" subTitle="Seul l'administrateur du magasin échange avec l'équipe Lumistock depuis cette page." />
  );

export default SupportAdmin;
