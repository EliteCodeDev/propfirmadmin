"use client";

import CardComponent from "@/components/user/cardComponent";
import TableComponent from "@/components/common/tableComponent";
import { UserIcon, ClockIcon, ExclamationTriangleIcon } from "@heroicons/react/24/outline";
import { useState } from "react";

export default function UserPage() {
  const [activeTab, setActiveTab] = useState("orders");

  // Datos para las cards superiores
  const contactFields = [
    { label: "Email", value: "rehanadil900@gmail.com" },
    { label: "Phone", value: "+923035703023" },
    { label: "Name", value: "Arslan Ahmed" },
    { label: "Address", value: "None of your business" }
  ];

  const accountFields = [
    { label: "Username", value: "Arslan768" },
    { label: "Coupon Code", value: "Arslan768" },
    { label: "Status", value: "pending" },
    { label: "Is Verified", value: "Yes" }
  ];

  const activityFields = [
    { label: "Updated Date", value: "5/6/2025" },
    { label: "Registration", value: "3/3/2025" },
    { label: "Login Count", value: "23" }
  ];

  // Tabs para la sección inferior
  const tabs = [
    { id: "orders", label: "Orders" },
    { id: "notes", label: "Notes" },
    { id: "prop-accounts", label: "Prop Accounts" },
    { id: "payouts", label: "Payouts" },
    { id: "emails", label: "E-Mails" },
    { id: "logs", label: "IP Logs" }
  ];

  // Columnas para la tabla de Prop Accounts
  const propAccountsColumns = [
    { key: 'accountNumber', label: 'Account Number', type: 'normal' as const },
    { key: 'accountType', label: 'Account Type', type: 'normal' as const },
    { key: 'accountSize', label: 'Account Size', type: 'normal' as const },
    { key: 'balance', label: 'Balance', type: 'normal' as const },
    { key: 'equity', label: 'Equity', type: 'normal' as const },
    { key: 'platform', label: 'Platform', type: 'normal' as const },
    { key: 'status', label: 'Status', type: 'badge' as const },
    { key: 'dateReceived', label: 'Date Received', type: 'normal' as const }
  ];

  // Datos para la tabla de Prop Accounts
  const propAccountsData = [
    {
      accountNumber: '789331412',
      accountType: '2-step-Challenge',
      accountSize: '10000',
      balance: '10000',
      equity: '10000',
      platform: '',
      status: 'Active',
      dateReceived: '30,May,25'
    },
    {
      accountNumber: '789331423',
      accountType: '2-step-Challenge',
      accountSize: '10000',
      balance: '10000',
      equity: '10000',
      platform: '',
      status: 'Active',
      dateReceived: '30,May,25'
    },
    {
      accountNumber: '789331446',
      accountType: '2-step-Challenge',
      accountSize: '50000',
      balance: '50000',
      equity: '50000',
      platform: '',
      status: 'Active',
      dateReceived: '02,June,25'
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Top Section - Buttons */}
        <div className="flex items-center justify-between">
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
              Total Spend $0
            </button>
            <button className="px-4 py-2 bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg text-sm font-medium">
              Total Withdrawals $0
            </button>
          </div>
          
          <div className="flex gap-3">
            <button className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-lg text-sm font-medium transition-colors">
              Add Doc
            </button>
            <button className="px-4 py-2 bg-green-500 hover:bg-green-600 text-white rounded-lg text-sm font-medium transition-colors">
              User Dashboard
            </button>
            <button className="px-4 py-2 bg-red-500 hover:bg-red-600 text-white rounded-lg text-sm font-medium transition-colors">
              Blacklist Client
            </button>
          </div>
        </div>

        {/* Cards Section */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <CardComponent
            title="Contact Information"
            icon={<UserIcon className="w-5 h-5 text-blue-600 dark:text-blue-400" />}
            fields={contactFields}
          />
          
          <CardComponent
            title="Account Details"
            icon={<ClockIcon className="w-5 h-5 text-purple-600 dark:text-purple-400" />}
            fields={accountFields}
          />
          
          <CardComponent
            title="Recent Activity"
            icon={<ExclamationTriangleIcon className="w-5 h-5 text-red-600 dark:text-red-400" />}
            fields={activityFields}
          />
        </div>

        {/* Prop Accounts Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                Prop Accounts
              </h2>
              <p className="text-gray-600 dark:text-gray-400">
                You can see prop accounts from here.
              </p>
            </div>
            
            <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 100 4m0-4v2m0-6V4" />
              </svg>
              Toggle Columns
            </button>
          </div>

          {/* Tabs */}
          <div className="flex space-x-1 bg-white dark:bg-gray-800 p-1 rounded-lg border shadow-sm w-fit">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-4 py-2 rounded-md text-sm font-medium transition-colors ${
                  activeTab === tab.id
                    ? 'bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-gray-100'
                    : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-100'
                }`}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Table Section */}
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
            <TableComponent 
              columns={propAccountsColumns}
              data={propAccountsData}
              color="blue"
            />
          </div>
        </div>

      </div>
    </div>
  );
}
