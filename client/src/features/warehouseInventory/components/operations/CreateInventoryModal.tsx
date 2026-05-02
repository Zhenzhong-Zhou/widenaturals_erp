import {
  createContext,
  type Dispatch,
  type FC,
  type SetStateAction,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { CustomModal, ErrorMessage } from '@components/index';
import MultiItemForm, {
  type MultiItemFormRef,
  type MultiItemFieldConfig,
  type RowAwareComponentProps,
} from '@components/common/MultiItemForm';
import {
  useBatchRegistryLookup,
  useWarehouseInventoryCreate,
} from '@hooks/index';
import type { CreateWarehouseInventoryRequest } from '@features/warehouseInventory';
import { BatchRegistryDropdown } from '@features/lookup/components';
import type {
  BatchRegistryLookupItem,
  BatchRegistryLookupQuery,
} from '@features/lookup';
import type { PaginationLookupInfo } from '@shared-types/pagination';

// ─── Props ────────────────────────────────────────────────────────────────────

interface StatusOption {
  value: string;
  label: string;
}

interface CreateInventoryModalProps {
  open: boolean;
  onClose: () => void;
  warehouseId: string;
  statusOptions: StatusOption[];
  onSuccess?: () => void;
}

// ─── Per-row lookup bundle (provided via context) ─────────────────────────────

interface BatchLookupBundle {
  inputValues: string[];
  setInputValues: Dispatch<SetStateAction<string[]>>;
  fetchParamsArray: BatchRegistryLookupQuery[];
  setFetchParamsArray: Dispatch<SetStateAction<BatchRegistryLookupQuery[]>>;
  options: BatchRegistryLookupItem[];
  loading: boolean;
  error: string | null;
  paginationMeta: PaginationLookupInfo;
  fetchOptions: (params: BatchRegistryLookupQuery) => void;
  defaultQuery: BatchRegistryLookupQuery;
}
// todo: batchType
const BatchLookupContext = createContext<BatchLookupBundle | null>(null);

// ─── Stable cell component ────────────────────────────────────────────────────
// Defined at module scope so its identity NEVER changes between renders.
// This is what stops MultiItemForm from unmounting/remounting MUI Autocomplete.

const BatchIdCell = ({
                       value,
                       onChange,
                       rowIndex,
                     }: RowAwareComponentProps<string>) => {
  const bundle = useContext(BatchLookupContext);
  if (!bundle) return null;
  
  const {
    inputValues,
    setInputValues,
    fetchParamsArray,
    setFetchParamsArray,
    options,
    loading,
    error,
    paginationMeta,
    fetchOptions,
  } = bundle;
  
  const inputValue = inputValues[rowIndex] ?? '';
  const fetchParams = fetchParamsArray[rowIndex] ?? bundle.defaultQuery;
  
  const setRowFetchParams: Dispatch<SetStateAction<BatchRegistryLookupQuery>> = (
    newOrUpdater
  ) => {
    setFetchParamsArray((prev) => {
      const copy = [...prev];
      const current = prev[rowIndex] ?? bundle.defaultQuery;
      copy[rowIndex] =
        typeof newOrUpdater === 'function'
          ? (newOrUpdater as (
            p: BatchRegistryLookupQuery
          ) => BatchRegistryLookupQuery)(current)
          : newOrUpdater;
      return copy;
    });
  };
  
  return (
    <BatchRegistryDropdown
      label="Batch ID"
      value={value ?? ''}
      onChange={(id) => onChange?.(id)}
      inputValue={inputValue}
      onInputChange={(_e, newVal) => {
        setInputValues((prev) => {
          const copy = [...prev];
          copy[rowIndex] = newVal;
          return copy;
        });
        setRowFetchParams((prev) => ({
          ...prev,
          keyword: newVal,
          offset: 0,
        }));
      }}
      options={options}
      loading={loading}
      error={error}
      paginationMeta={paginationMeta}
      fetchParams={fetchParams}
      setFetchParams={setRowFetchParams}
      onRefresh={(params) => fetchOptions(params)}
    />
  );
};

// ─── Fields ───────────────────────────────────────────────────────────────────

const buildFields = (
  statusOptions: StatusOption[]
): MultiItemFieldConfig[] => [
  {
    id: 'batchId',
    label: 'Batch ID',
    type: 'custom',
    required: true,
    grid: { xs: 12, sm: 6 },
    component: BatchIdCell, // stable reference
  },
  {
    id: 'warehouseQuantity',
    label: 'Quantity',
    type: 'number',
    required: true,
    grid: { xs: 12, sm: 6 },
  },
  {
    id: 'warehouseFee',
    label: 'Warehouse Fee',
    type: 'number',
    required: false,
    placeholder: '0.00',
    grid: { xs: 12, sm: 4 },
  },
  {
    id: 'inboundDate',
    label: 'Inbound Date',
    type: 'date',
    required: false,
    grid: { xs: 12, sm: 4 },
  },
  {
    id: 'statusId',
    label: 'Status',
    type: 'select',
    required: false,
    options: statusOptions,
    grid: { xs: 12, sm: 4 },
  },
];

// ─── Payload builder ──────────────────────────────────────────────────────────

const buildPayload = (
  rows: Record<string, any>[]
): CreateWarehouseInventoryRequest => ({
  records: rows.map((r) => ({
    batchId: r.batchId,
    warehouseQuantity: Number(r.warehouseQuantity),
    ...(r.warehouseFee !== '' &&
      r.warehouseFee != null && {
        warehouseFee: Number(r.warehouseFee),
      }),
    ...(r.inboundDate && { inboundDate: r.inboundDate }),
    ...(r.statusId && { statusId: r.statusId }),
  })),
});

// ─── Component ────────────────────────────────────────────────────────────────

const CreateInventoryModal: FC<CreateInventoryModalProps> = ({
                                                               open,
                                                               onClose,
                                                               warehouseId,
                                                               statusOptions,
                                                               onSuccess,
                                                             }) => {
  const {
    loading: createLoading,
    error: createError,
    createResponse,
    createWarehouseInventory,
  } = useWarehouseInventoryCreate();
  
  const {
    items: batchRegistryOptions,
    loading: batchLookupLoading,
    error: batchLookupError,
    meta: batchLookupMeta,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: resetBatchRegistryLookup,
  } = useBatchRegistryLookup();
  
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [fetchParamsArray, setFetchParamsArray] = useState<
    BatchRegistryLookupQuery[]
  >([]);
  
  const defaultLookupQuery = useMemo<BatchRegistryLookupQuery>(
    () => ({ keyword: '', limit: 10, offset: 0, warehouseId }),
    [warehouseId]
  );
  
  const formRef = useRef<MultiItemFormRef>(null);
  const fetchRef = useRef(fetchBatchRegistryLookup);
  const resetRef = useRef(resetBatchRegistryLookup);
  fetchRef.current = fetchBatchRegistryLookup;
  resetRef.current = resetBatchRegistryLookup;
  
  // Initial fetch when modal opens; clear lookup + per-row state when it closes
  useEffect(() => {
    if (!open) return;
    fetchRef.current(defaultLookupQuery);
    return () => {
      resetRef.current();
      setInputValues([]);
      setFetchParamsArray([]);
    };
  }, [open, defaultLookupQuery]);
  
  const onCloseRef = useRef(onClose);
  const onSuccessRef = useRef(onSuccess);
  onCloseRef.current = onClose;
  onSuccessRef.current = onSuccess;
  
  useEffect(() => {
    if (createResponse) {
      onCloseRef.current();
      onSuccessRef.current?.();
    }
  }, [createResponse]);
  
  const fields = useMemo(() => buildFields(statusOptions), [statusOptions]);
  
  const bundle = useMemo<BatchLookupBundle>(
    () => ({
      inputValues,
      setInputValues,
      fetchParamsArray,
      setFetchParamsArray,
      options: batchRegistryOptions,
      loading: batchLookupLoading,
      error: batchLookupError,
      paginationMeta: batchLookupMeta,
      fetchOptions: (params) => fetchRef.current(params),
      defaultQuery: defaultLookupQuery,
    }),
    [
      inputValues,
      fetchParamsArray,
      batchRegistryOptions,
      batchLookupLoading,
      batchLookupError,
      batchLookupMeta,
      defaultLookupQuery,
    ]
  );
  
  const onSubmit = (rows: Record<string, any>[]) => {
    void createWarehouseInventory(warehouseId, buildPayload(rows));
  };
  
  return (
    <CustomModal open={open} onClose={onClose} title="Add Inventory Records">
      {createError && <ErrorMessage message={createError} />}
      
      <BatchLookupContext.Provider value={bundle}>
        <MultiItemForm
          ref={formRef}
          fields={fields}
          onSubmit={onSubmit}
          loading={createLoading}
          showSubmitButton
          getItemTitle={(index) => `Record ${index + 1}`}
        />
      </BatchLookupContext.Provider>
    </CustomModal>
  );
};

export default CreateInventoryModal;
