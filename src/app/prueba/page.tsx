"use client";

import TableComponent from "@/components/common/tableComponent";
import { MagnifyingGlassIcon, TableCellsIcon, ArrowDownTrayIcon } from "@heroicons/react/24/outline";
import { useState } from "react";
import CardComponent from "@/components/user/cardComponent";


export default function Page() {
  const [activeTab, setActiveTab] = useState("all");
  const [showColumnToggle, setShowColumnToggle] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  const tabs = [
    { id: "all", label: "All Orders" },
    { id: "succeeded", label: "Succeeded" },
    { id: "failed", label: "Failed Orders" }
  ];

  // Data completa - aquí estarían todos tus datos
  const allData = [
    {
      orderId: '6810cd3da8c44ae62a3b4d9d',
      method: 'Crypto',
      amount: '$59.5',
      firstName: 'Zamin',
      lastName: 'Mazhar',
      email: 'wicedaegis@outlook.com',
      particulars: 'matchTrader',
      status: 'Failed',
      time: 'N/A'
    },
    {
      orderId: '6810cb4aa8c44ae62a3b4ca6',
      method: 'Crypto',
      amount: '$69.3',
      firstName: 'TESTER',
      lastName: 'xxxd',
      email: 'yemiworkk@z1techs.com',
      particulars: 'tradeLocker',
      status: 'Failed',
      time: 'N/A'
    },
    {
      orderId: '680d1a7539b0b6e87e454d00',
      method: 'Card',
      amount: '$69.3',
      firstName: 'Ahmad',
      lastName: 'Raza',
      email: 'ahmadraza77887087@z1techs.com',
      particulars: 'tradeLocker',
      status: 'Failed',
      time: 'N/A'
    },
    {
      orderId: '67f17cbf0b35e55e7c049a73',
      method: 'Card',
      amount: '$167.3',
      firstName: 'Ahmad',
      lastName: 'Raza',
      email: 'ahmadraza77887087@z1techs.com',
      particulars: 'tradeLocker',
      status: 'Successful',
      time: '11:55:59 PM:05,April,25'
    },
    {
      orderId: '67f17c320b35e55e7c049a1f',
      method: 'Card',
      amount: '$167.3',
      firstName: 'Ahmad',
      lastName: 'Raza',
      email: 'ahmadraza77887087@z1techs.com',
      particulars: 'tradeLocker',
      status: 'Successful',
      time: '11:53:38 PM:05,April,25'
    },
    {
      orderId: '6809539408a88584d8788ff9',
      method: 'Card',
      amount: '$251.3',
      firstName: 'Tester',
      lastName: 'Ghost',
      email: 'muhammadahmadraza@dev@z1techs.com',
      particulars: 'mt5',
      status: 'Failed',
      time: 'N/A'
    }
  ];

  // Función para filtrar por tabs
  const getFilteredDataByTab = () => {
    switch (activeTab) {
      case 'succeeded':
        return allData.filter(item => item.status === 'Successful');
      case 'failed':
        return allData.filter(item => item.status === 'Failed');
      case 'all':
      default:
        return allData;
    }
  };

  // Función para filtrar por búsqueda
  const getFilteredData = () => {
    const tabFilteredData = getFilteredDataByTab();
    
    if (!searchTerm.trim()) {
      return tabFilteredData;
    }

    return tabFilteredData.filter(item => 
      Object.values(item).some(value => 
        value.toString().toLowerCase().includes(searchTerm.toLowerCase())
      )
    );
  };

  // Data final filtrada
  const filteredData = getFilteredData();

  const columns = [
    { key: 'orderId', label: 'Order ID', type: 'normal' as const },
    { key: 'method', label: 'Method', type: 'normal' as const },
    { key: 'amount', label: 'Amount', type: 'normal' as const },
    { key: 'firstName', label: 'First Name', type: 'normal' as const },
    { key: 'lastName', label: 'Last Name', type: 'normal' as const },
    { 
      key: 'email', 
      label: 'Email', 
      type: 'link' as const,
      linkUrl: (email: string, row: any) => `/usuario/${row.orderId}`
    },
    { key: 'particulars', label: 'Particulars', type: 'normal' as const },
    { key: 'status', label: 'Processed', type: 'badge' as const },
    { key: 'time', label: 'Time', type: 'normal' as const }
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* Header Section */}
        <div className="space-y-2">
          <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100">
            Orders
          </h1>
          <p className="text-gray-600 dark:text-gray-400">
            You can see all orders from here.
          </p>
        </div>

        {/* Tabs Section */}
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

        {/* View All Orders Section */}
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h2 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
              View All Orders
            </h2>
            
            {/* Right side controls */}
            <div className="flex items-center gap-3">
              {/* Toggle Columns Button */}
              <div className="relative">
                <button
                  onClick={() => setShowColumnToggle(!showColumnToggle)}
                  className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <TableCellsIcon className="w-4 h-4" />
                  Toggle Columns
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                  </svg>
                </button>
                
                {/* Column Toggle Dropdown */}
                {showColumnToggle && (
                  <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg shadow-lg z-10 p-2">
                    {columns.map((column) => (
                      <label key={column.key} className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">{column.label}</span>
                      </label>
                    ))}
                    <div className="border-t border-gray-200 dark:border-gray-600 mt-2 pt-2">
                      <label className="flex items-center gap-2 p-2 hover:bg-gray-50 dark:hover:bg-gray-700 rounded cursor-pointer">
                        <input 
                          type="checkbox" 
                          defaultChecked 
                          className="rounded border-gray-300"
                        />
                        <span className="text-sm text-gray-700 dark:text-gray-300">↑↓</span>
                      </label>
                    </div>
                  </div>
                )}
              </div>

              {/* Export Button */}
              <button className="flex items-center gap-2 px-3 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                <ArrowDownTrayIcon className="w-4 h-4" />
                Export
              </button>

              {/* Search */}
              <div className="relative">
                <MagnifyingGlassIcon className="w-4 h-4 absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="pl-10 pr-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          {/* All New Sales Button */}
          <div className="flex items-center justify-between">
            <button className="px-4 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              All New Sales
            </button>
            
            <div className="text-sm font-medium text-gray-900 dark:text-gray-100 bg-white dark:bg-gray-800 px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600">
              Total Orders: {filteredData.length}
            </div>
          </div>
        </div>

        {/* Table Section */}
        <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm">
          <TableComponent 
            columns={columns}
            data={filteredData}
            color="blue"
          />
        </div>

      </div>

      <CardComponent />
    </div>
  );
}