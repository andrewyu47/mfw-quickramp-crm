/**
 * Clinic — detail view for a single customer clinic.
 *
 * What this demonstrates:
 *   - GraphQL query WITH variables — the AccountId from the URL param
 *   - Two queries in one page: the parent Account, and its child Contacts
 *   - useParams from react-router for dynamic-route data binding
 *   - shadcn Card pattern for the parent record, Table for the related list
 */
import { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router';
import { gql } from '@salesforce/sdk-data';
import { executeGraphQL } from '@/api/graphqlClient';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Spinner } from '@/components/ui/spinner';

const CLINIC_DETAIL_QUERY = gql`
  query ClinicDetail($accountId: ID!) {
    uiapi {
      query {
        Account(where: { Id: { eq: $accountId } }, first: 1) {
          edges {
            node {
              Id
              Name { value }
              BillingCity { value }
              BillingState { value }
              NumberOfEmployees { value }
              Industry { value }
            }
          }
        }
        Contact(
          where: { AccountId: { eq: $accountId } }
          orderBy: { Name: { order: ASC } }
        ) {
          edges {
            node {
              Id
              Name { value }
              Title { value }
              Email { value }
              Phone { value }
            }
          }
        }
      }
    }
  }
`;

interface ClinicDetailResponse {
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
            Industry: { value: string | null };
          };
        }>;
      };
      Contact: {
        edges: Array<{
          node: {
            Id: string;
            Name: { value: string | null };
            Title: { value: string | null };
            Email: { value: string | null };
            Phone: { value: string | null };
          };
        }>;
      };
    };
  };
}

interface ClinicDetailVariables {
  accountId: string;
}

interface ClinicSummary {
  id: string;
  name: string;
  city: string | null;
  state: string | null;
  employees: number | null;
  industry: string | null;
}

interface ClinicianRow {
  id: string;
  name: string;
  title: string | null;
  email: string | null;
  phone: string | null;
}

export default function Clinic() {
  const { id } = useParams<{ id: string }>();
  const [clinic, setClinic] = useState<ClinicSummary>();
  const [clinicians, setClinicians] = useState<ClinicianRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string>();

  useEffect(() => {
    if (!id) {
      setError('Missing clinic ID in URL');
      setLoading(false);
      return;
    }

    const fetchDetail = async () => {
      try {
        const data = await executeGraphQL<ClinicDetailResponse, ClinicDetailVariables>(
          CLINIC_DETAIL_QUERY as unknown as string,
          { accountId: id }
        );

        const accountNode = data.uiapi.query.Account.edges[0]?.node;
        if (!accountNode) {
          setError('Clinic not found.');
          return;
        }

        setClinic({
          id: accountNode.Id,
          name: accountNode.Name?.value ?? 'Unnamed clinic',
          city: accountNode.BillingCity?.value ?? null,
          state: accountNode.BillingState?.value ?? null,
          employees: accountNode.NumberOfEmployees?.value ?? null,
          industry: accountNode.Industry?.value ?? null,
        });

        setClinicians(
          data.uiapi.query.Contact.edges.map(({ node }) => ({
            id: node.Id,
            name: node.Name?.value ?? 'Unnamed clinician',
            title: node.Title?.value ?? null,
            email: node.Email?.value ?? null,
            phone: node.Phone?.value ?? null,
          }))
        );
      } catch (err) {
        setError(err instanceof Error ? err.message : 'Failed to load clinic detail');
      } finally {
        setLoading(false);
      }
    };
    fetchDetail();
  }, [id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 flex justify-center">
        <Spinner />
      </div>
    );
  }
  if (error || !clinic) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <p className="text-red-600 mb-4">{error ?? 'Clinic not found.'}</p>
        <Link to="/clinics" className="text-blue-700 hover:underline">
          ← Back to all clinics
        </Link>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 space-y-6">
      <Link to="/clinics" className="text-sm text-blue-700 hover:underline">
        ← All clinics
      </Link>

      <Card>
        <CardHeader>
          <CardTitle>{clinic.name}</CardTitle>
          <CardDescription>
            {[clinic.city, clinic.state].filter(Boolean).join(', ') || 'Location unknown'}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <dl className="grid grid-cols-2 gap-4 text-sm">
            <div>
              <dt className="text-gray-500">Industry</dt>
              <dd className="text-gray-900">{clinic.industry ?? '—'}</dd>
            </div>
            <div>
              <dt className="text-gray-500">Employees on file</dt>
              <dd className="text-gray-900 tabular-nums">
                {clinic.employees?.toLocaleString() ?? '—'}
              </dd>
            </div>
          </dl>
        </CardContent>
      </Card>

      <section>
        <h2 className="text-xl font-semibold text-gray-900 mb-3">
          Clinicians ({clinicians.length})
        </h2>
        {clinicians.length === 0 ? (
          <p className="text-sm text-gray-600">No clinicians on file at this clinic yet.</p>
        ) : (
          <div className="bg-white rounded-md border border-gray-200">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Title</TableHead>
                  <TableHead>Email</TableHead>
                  <TableHead>Phone</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {clinicians.map(c => (
                  <TableRow key={c.id}>
                    <TableCell className="font-medium">{c.name}</TableCell>
                    <TableCell className="text-gray-600">{c.title ?? '—'}</TableCell>
                    <TableCell className="text-gray-600">{c.email ?? '—'}</TableCell>
                    <TableCell className="text-gray-600 tabular-nums">
                      {c.phone ?? '—'}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        )}
      </section>
    </div>
  );
}
