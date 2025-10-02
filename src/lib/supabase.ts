import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;
const useMock = String(import.meta.env.VITE_USE_MOCK || '').toLowerCase() === 'true'
  || String(import.meta.env.VITE_USE_MOCK || '') === '1';

function createMockSupabase() {
  type MockUser = { id: string; email: string };

  const demoUser: MockUser = { id: 'demo-user-1', email: 'doctor@hospital.com' };
  let currentUser: MockUser | null = null;

  type TableRow = Record<string, any>;
  type TableName = 'patients' | 'documents' | 'ai_summaries';

  const nowIso = () => new Date().toISOString();
  const randomId = () => crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).slice(2);

  const demoPatientId = randomId();
  const db: Record<TableName, TableRow[]> = {
    patients: [
      {
        id: demoPatientId,
        first_name: 'Jane',
        last_name: 'Doe',
        date_of_birth: '1985-04-12',
        email: 'jane.doe@example.com',
        phone: '+1 (555) 111-2233',
        address: '123 Main St, Springfield',
        medical_record_number: 'MRN-00001',
        created_by: demoUser.id,
        created_at: nowIso(),
        updated_at: nowIso()
      },
      {
        id: randomId(),
        first_name: 'John',
        last_name: 'Smith',
        date_of_birth: '1979-11-23',
        email: null,
        phone: null,
        address: null,
        medical_record_number: 'MRN-00002',
        created_by: demoUser.id,
        created_at: nowIso(),
        updated_at: nowIso()
      }
    ],
    documents: [
      {
        id: randomId(),
        patient_id: demoPatientId,
        file_name: 'cbc_results.pdf',
        file_path: `${demoPatientId}/cbc_results.pdf`,
        file_type: 'application/pdf',
        file_size: 234567,
        description: 'Complete blood count - normal range',
        uploaded_by: demoUser.id,
        created_at: nowIso()
      }
    ],
    ai_summaries: []
  };

  type SelectBuilder = {
    eq: (column: string, value: any) => SelectBuilder & Promise<{ data: any[]; error: null }>;
    order: (
      column: string,
      opts?: { ascending?: boolean }
    ) => Promise<{ data: any[]; error: null }>;
    then?: any;
  };

  function makeSelectBuilder(table: TableName): SelectBuilder {
    let filters: { column: string; value: any }[] = [];
    let orderBy: string | null = null;
    let orderAsc = true;

    const exec = async () => {
      let rows = [...db[table]];
      for (const f of filters) {
        rows = rows.filter((r) => r[f.column] === f.value);
      }
      if (orderBy) {
        rows.sort((a, b) => {
          const av = a[orderBy!];
          const bv = b[orderBy!];
          if (av === bv) return 0;
          // When ascending is false, newest (greater) first
          if (orderAsc) {
            return av < bv ? -1 : 1;
          }
          return av > bv ? -1 : 1;
        });
      }
      return { data: rows, error: null } as const;
    };

    const builder: any = {
      eq: (column: string, value: any) => {
        filters.push({ column, value });
        return builder;
      },
      order: (column: string, opts?: { ascending?: boolean }) => {
        orderBy = column;
        orderAsc = opts?.ascending === false ? false : true;
        return exec();
      },
      then: (resolve: any, reject: any) => exec().then(resolve, reject)
    };

    return builder as SelectBuilder;
  }

  function from(table: TableName) {
    return {
      select: (_cols = '*') => makeSelectBuilder(table),
      insert: async (payload: any) => {
        const rows = Array.isArray(payload) ? payload : [payload];
        const withIds = rows.map((r) => {
          const id = r.id || randomId();
          const created = nowIso();
          return {
            ...r,
            id,
            created_at: r.created_at ?? created,
            updated_at: r.updated_at ?? created
          };
        });
        db[table].unshift(...withIds);
        return { data: withIds, error: null } as const;
      }
    };
  }

  const listeners = new Set<(event: string, session: any) => void>();

  const auth = {
    async signInWithPassword({ email, password }: { email: string; password: string }) {
      if ((email === demoUser.email) && password === 'demo1234') {
        currentUser = demoUser;
        const session = { user: { id: demoUser.id, email: demoUser.email } } as any;
        listeners.forEach((fn) => fn('SIGNED_IN', session));
        return { data: { user: session.user, session }, error: null } as const;
      }
      return { data: { user: null, session: null }, error: new Error('Invalid login credentials') } as const;
    },
    async signUp({ email, password: _password }: { email: string; password: string }) {
      currentUser = { id: randomId(), email };
      const session = { user: { id: currentUser.id, email: currentUser.email } } as any;
      listeners.forEach((fn) => fn('SIGNED_IN', session));
      return { data: { user: session.user, session }, error: null } as const;
    },
    async signOut() {
      currentUser = null;
      listeners.forEach((fn) => fn('SIGNED_OUT', { user: null } as any));
    },
    async getSession() {
      const session = currentUser ? ({ user: { id: currentUser.id, email: currentUser.email } } as any) : null;
      return { data: { session }, error: null } as const;
    },
    onAuthStateChange(cb: (event: string, session: any) => void) {
      listeners.add(cb);
      const session = currentUser ? ({ user: { id: currentUser.id, email: currentUser.email } } as any) : null;
      // Emit current session asynchronously to mimic real behavior
      setTimeout(() => cb('INITIAL_SESSION', session), 0);
      return { data: { subscription: { unsubscribe: () => listeners.delete(cb) } } } as const;
    }
  };

  return {
    from,
    auth
  } as any;
}

export const supabase: any = useMock
  ? createMockSupabase()
  : (supabaseUrl && supabaseAnonKey)
    ? createClient(supabaseUrl, supabaseAnonKey)
    : createMockSupabase();

if (useMock || !supabaseUrl || !supabaseAnonKey) {
  // Helps confirm in DevTools that we're not hitting a real backend
  console.info('[Khumalo] Using in-memory mock database (no external DB required).');
}

export type Patient = {
  id: string;
  first_name: string;
  last_name: string;
  date_of_birth: string;
  email: string | null;
  phone: string | null;
  address: string | null;
  medical_record_number: string;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type Document = {
  id: string;
  patient_id: string;
  file_name: string;
  file_path: string;
  file_type: string;
  file_size: number;
  description: string | null;
  uploaded_by: string;
  created_at: string;
};

export type AISummary = {
  id: string;
  patient_id: string;
  summary_text: string;
  generated_by: string;
  created_at: string;
};
