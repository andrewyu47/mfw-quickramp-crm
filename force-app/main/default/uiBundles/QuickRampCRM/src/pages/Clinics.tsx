/**
 * Clinics — list view of QuickRamp's customer healthcare orgs.
 *
 * What this demonstrates:
 *   - GraphQL UIAPI query against the Account SObject
 *   - Inline filter (Industry) and orderBy (NumberOfEmployees DESC)
 *   - The Salesforce-specific edges → node → { value } unwrap pattern
 *   - shadcn Table rendering with react-router Link to detail page
 */
import { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { gql } from '@salesforce/sdk-data';
import { executeGraphQL } from '@/api/graphqlClient';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';

// Inline so the lesson is self-contained — matches recipes-repo convention.
const TOP_CLINICS_QUERY = gql`
  query TopClinics {
    uiapi {
      query {
        Account(
          where: { Industry: { eq: "Healthcare" } }
          orderBy: { NumberOfEmployees: { order: DESC, nulls: LAST } }
          first: 10
        ) {
          edges {
            node {
              Id
              Name { value }
              BillingCity { value }
              BillingState { value }
              NumberOfEmployees { value }
            }
          }
        }
      }
    }
  }
`;

interface TopClinicsResponse {
  uiapi: {
    query: {
      Account: {
        edges: Array<{
          node: {
            Id: string;
            Name: { value: string | null };
            BillingCity: { value: string | null };
            BillingState: { value: string | null };
            NumberOfEmployees: { value: number | null };
          };
        }>;
      };
    };
  };
}

interface ClinicRow {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  employees: number | null;
}

export default function Clinics() {
  const [clinics, setClinics] = useState<ClinicRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    const fetchClinics = async () => {
      try {
        const data = await executeGraphQL<TopClinicsResponse, undefined>(
          TOP_CLINICS_QUERY as unknown as string
        );
        const rows = data.uiapi.query.Account.edges.map(({ node }) => ({
          id: node.Id,
          name: node.Name?.value ?? 'Unnamed clinic',
          city: node.BillingCity?.value ?? null,
          state: node.BillingState?.value ?? null,
          employees: node.NumberOfEmployees?.value ?? null,
        }));
        setClinics(rows);
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clinics');
      } finally {
        setLoading(false);
      }
    };
    fetchClinics();
  }, []);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <Spinner />
      </div>
    );
  }
  if (error) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-600">Error loading clinics: {error}</p>
      </div>
    );
  }
  if (clinics.length === 0) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-gray-600">
          No Healthcare-industry Accounts found. Run the seed script in <code>scripts/soql/</code>.
        </p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <header className="mb-6">
        <h1 className="text-3xl font-semibold text-gray-900">Customer Clinics</h1>
        <p className="text-sm text-gray-600 mt-1">
          QuickRamp's top 10 healthcare-org accounts, sorted by clinician count.
        </p>
      </header>
      <div className="bg-white rounded-md border border-gray-200">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Clinic</TableHead>
              <TableHead>Location</TableHead>
              <TableHead className="text-right">Clinicians</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {clinics.map(clinic => (
              <TableRow key={clinic.id}>
                <TableCell>
                  <Link
                    to={`/clinics/${clinic.id}`}
                    className="text-blue-700 hover:underline font-medium"
                  >
                    {clinic.name}
                  </Link>
                </TableCell>
                <TableCell className="text-gray-600">
                  {[clinic.city, clinic.state].filter(Boolean).join(', ') || '—'}
                </TableCell>
                <TableCell className="text-right tabular-nums">
                  {clinic.employees?.toLocaleString() ?? '—'}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
