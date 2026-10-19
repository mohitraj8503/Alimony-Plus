
"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useRef,
  useState,
  type Dispatch,
  type ReactNode,
  type SetStateAction,
} from "react";
import { useRouter } from "next/navigation";

import { api } from "@/lib/api";
import { demoWorkspace, DEMO_DATE } from "@/lib/demo";
import { today } from "@/lib/ledger";

import type {
  Workspace,
  CaseRecord,
  Proceeding,
  Order,
  Payment,
} from "@/lib/types";

export type WorkspaceRole = "LITIGANT" | "ADVOCATE" | "MEDIATOR";

export const WORKSPACE_ROLES = [
  {
    id: "LITIGANT",
    label: "Litigant",
    description: "Personal case and maintenance workspace",
  },
  {
    id: "ADVOCATE",
    label: "Bar Council Advocate",
    description: "Advocacy and permitted case records",
  },
  {
    id: "MEDIATOR",
    label: "Court Mediator",
    description: "Mediation and permitted proceedings",
  },
] as const;

const ROLE_STORAGE_KEY = "alimony-workspace-role";

function isWorkspaceRole(value: unknown): value is WorkspaceRole {
  return (
    value === "LITIGANT" ||
    value === "ADVOCATE" ||
    value === "MEDIATOR"
  );
}

function emptyWorkspace(): Workspace {
  return {
    cases: [],
    proceedings: [],
    orders: [],
    payments: [],
    hearings: [],
    documents: [],
    sources: [],
  };
}

type Context = {
  data: Workspace;
  demo: boolean;
  asOf: string;
  name: string;
  loading: boolean;
  error: string;
  notice: string;
  setNotice: (value: string) => void;
  selectedCase: number;
  setSelectedCase: (value: number) => void;
  setData: Dispatch<SetStateAction<Workspace>>;
  refresh: () => Promise<void>;
  enterLive: (name: string) => Promise<void>;
  resetDemo: () => void;
  logout: () => Promise<void>;
  create: (
    kind: "cases" | "proceedings" | "orders" | "payments",
    body: Record<string, unknown>,
  ) => Promise<void>;
  role: WorkspaceRole;
  setRole: (role: WorkspaceRole) => void;
  roleHydrated: boolean;
};

const Store = createContext<Context | null>(null);

export function WorkspaceProvider({
  children,
}: {
  children: ReactNode;
}) {
  const router = useRouter();
  const requestGeneration = useRef(0);

  const [data, setData] = useState<Workspace>(() => demoWorkspace());
  const [demo, setDemo] = useState(true);
  const [name, setName] = useState("Meera");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [notice, setNotice] = useState("");
  const [selectedCase, setSelectedCase] = useState(0);

  const [role, setRoleState] = useState<WorkspaceRole>("LITIGANT");
  const [roleHydrated, setRoleHydrated] = useState(false);

  // Restore the previously selected role after the component mounts.
  useEffect(() => {
    try {
      const savedRole = window.localStorage.getItem(ROLE_STORAGE_KEY);

      if (isWorkspaceRole(savedRole)) {
        setRoleState(savedRole);
      }
    } catch {
      // Storage may be unavailable; keep the default role.
    } finally {
      setRoleHydrated(true);
    }
  }, []);

  // Persist role changes only after initial hydration.
  useEffect(() => {
    if (!roleHydrated) return;

    try {
      window.localStorage.setItem(ROLE_STORAGE_KEY, role);
    } catch {
      // The workspace continues to work if storage is unavailable.
    }
  }, [role, roleHydrated]);

  const setRole = useCallback((nextRole: WorkspaceRole) => {
    setRoleState(nextRole);
  }, []);

  const loadLive = useCallback(async () => {
    const generation = ++requestGeneration.current;

    setLoading(true);
    setError("");

    try {
      const { cases } = await api<{ cases: CaseRecord[] }>("cases");

      const proceedings = (
        await Promise.all(
          cases.map((item) =>
            api<{ proceedings: Proceeding[] }>(
              `proceedings/case/${item.id}`,
            ),
          ),
        )
      ).flatMap((result) => result.proceedings);

      const orders = (
        await Promise.all(
          proceedings.map((item) =>
            api<{ orders: Order[] }>(
              `orders/proceeding/${item.id}`,
            ),
          ),
        )
      )
        .flatMap((result) => result.orders)
        .map((item) => ({
          ...item,
          amount: Number(item.amount || 0),
        }));

      const payments = (
        await Promise.all(
          orders.map((item) =>
            api<{ payments: Payment[] }>(
              `payments/order/${item.id}`,
            ),
          ),
        )
      )
        .flatMap((result) => result.payments)
        .map((item) => ({
          ...item,
          amount: Number(item.amount),
        }));

      if (generation === requestGeneration.current) {
        setData((previous) => ({
          ...previous,
          cases,
          proceedings,
          orders,
          payments,
        }));
      }
    } catch (err) {
      if (generation === requestGeneration.current) {
        setError(
          err instanceof Error
            ? err.message
            : "Unable to load workspace data.",
        );
      }
    } finally {
      if (generation === requestGeneration.current) {
        setLoading(false);
      }
    }
  }, []);

  const enterLive = useCallback(
    async (userName: string) => {
      setDemo(false);
      setName(userName);
      setData(emptyWorkspace());
      setSelectedCase(0);
      await loadLive();
    },
    [loadLive],
  );

  const resetDemo = useCallback(() => {
    requestGeneration.current += 1;
    setLoading(false);
    setDemo(true);
    setName("Meera");
    setData(demoWorkspace());
    setSelectedCase(0);
    setError("");
    setNotice("Demo reset. All records are synthetic.");
  }, []);

  const logout = useCallback(async () => {
    try {
      if (!demo) {
        await api("auth/logout", {});
      }
    } catch {
      setError("The server logout request failed.");
    } finally {
      resetDemo();
      router.push("/login");
    }
  }, [demo, resetDemo, router]);

  // Clear live workspace data after 15 minutes without activity.
  useEffect(() => {
    if (demo) return;

    let timer: ReturnType<typeof setTimeout>;

    const resetInactivityTimer = () => {
      clearTimeout(timer);

      timer = setTimeout(() => {
        requestGeneration.current += 1;
        setLoading(false);
        setData(emptyWorkspace());
        setDemo(true);
        setName("Guest");
        setNotice("Your session was cleared after inactivity.");

        void api("auth/logout", {}).catch(() => {});
        router.push("/login");
      }, 15 * 60 * 1000);
    };

    resetInactivityTimer();

    window.addEventListener("pointerdown", resetInactivityTimer);
    window.addEventListener("keydown", resetInactivityTimer);

    return () => {
      clearTimeout(timer);
      window.removeEventListener("pointerdown", resetInactivityTimer);
      window.removeEventListener("keydown", resetInactivityTimer);
    };
  }, [demo, router]);

  const create = useCallback(
    async (
      kind: "cases" | "proceedings" | "orders" | "payments",
      body: Record<string, unknown>,
    ) => {
      if (demo) {
        const record = {
          ...body,
          id: Date.now(),
          createdAt: DEMO_DATE,
          status:
            body.status ||
            (kind === "cases" ? "ACTIVE" : "ONGOING"),
        };

        setData((previous) => {
          const existingRecords = previous[kind] as Array<
            Record<string, unknown>
          >;

          return {
            ...previous,
            [kind]: [...existingRecords, record],
          };
        });
      } else {
        await api(kind, body);
        await loadLive();
      }

      setNotice(
        demo
          ? "Saved in this demo session. Refreshing clears demo changes."
          : "Record saved.",
      );
    },
    [demo, loadLive],
  );

  const value: Context = {
    data,
    demo,
    asOf: demo ? DEMO_DATE : today(),
    name,
    loading,
    error,
    notice,
    setNotice,
    selectedCase,
    setSelectedCase,
    setData,
    refresh: loadLive,
    enterLive,
    resetDemo,
    logout,
    create,
    role,
    setRole,
    roleHydrated,
  };

  return <Store.Provider value={value}>{children}</Store.Provider>;
}

export function useWorkspace(): Context {
  const store = useContext(Store);

  if (!store) {
    throw new Error("useWorkspace must be used within WorkspaceProvider");
  }

  return store;
}
