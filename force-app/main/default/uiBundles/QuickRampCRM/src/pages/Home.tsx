import { Link } from 'react-router';

export default function Home() {
  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center max-w-2xl mx-auto">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">QuickRamp CRM</h1>
        <p className="text-lg text-gray-600 mb-8">
          The customer-management view QuickRamp's CSMs open every morning to see
          which clinics are mid-onboarding. Built natively on the Agentforce 360
          Platform with Salesforce Multi-Framework — React, GraphQL UIAPI, and
          UI Bundle metadata.
        </p>
        <Link
          to="/clinics"
          className="inline-block px-5 py-2 bg-blue-700 text-white rounded-md hover:bg-blue-800 transition-colors"
        >
          View Customer Clinics →
        </Link>
      </div>
    </div>
  );
}
