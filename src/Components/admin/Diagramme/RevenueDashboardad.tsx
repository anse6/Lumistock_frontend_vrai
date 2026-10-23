// RevenueDashboard.tsx - Composant principal qui rassemble tout
import React from 'react';
import  RevenueChart  from './RevenueChart';
import { PaymentStatsChart } from './PaymentStatsChart';


const RevenueDashboard: React.FC = () => {
  return (
    <div className="flex flex-col lg:flex-row w-full gap-4 -translate-y-7">
      <RevenueChart />
      <PaymentStatsChart />
      {/* <PaymentStatsChart /> */}
    </div>
  );
};

export default RevenueDashboard;


