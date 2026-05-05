import {
  createContext,
  type Dispatch,
  type FC,
  type SetStateAction,
  type MouseEvent,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  Box,
  ToggleButton,
  ToggleButtonGroup
} from '@mui/material';
import {
  CustomButton,
  CustomModal,
  CustomTypography,
  ErrorMessage,
} from '@components/index';
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
import type { BatchTypeFilter } from '@shared-types/batch';
import { composeBatchTitle } from '@features/lookup/utils/batchRegistryUtils';

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
  onSuccess?: (message?: string) => void;
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
  globalBatchType: BatchTypeFilter;
  pickedBatches: Record<string, BatchRegistryLookupItem>;
  cachePickedBatch: (item: BatchRegistryLookupItem) => void;
}

const BatchLookupContext = createContext<BatchLookupBundle | null>(null);

// ─── Stable cell component (module scope — identity never changes) ────────────

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
    defaultQuery,
    pickedBatches,
    cachePickedBatch,
  } = bundle;
  
  const inputValue = inputValues[rowIndex] ?? '';
  const fetchParams = fetchParamsArray[rowIndex] ?? defaultQuery;
  
  const setRowFetchParams: Dispatch<
    SetStateAction<BatchRegistryLookupQuery>
  > = (newOrUpdater) => {
    setFetchParamsArray((prev) => {
      const copy = [...prev];
      const current = prev[rowIndex] ?? defaultQuery;
      copy[rowIndex] =
        typeof newOrUpdater === 'function'
          ? (newOrUpdater as (
            p: BatchRegistryLookupQuery
          ) => BatchRegistryLookupQuery)(current)
          : newOrUpdater;
      return copy;
    });
  };
  
  const stickyOptions = useMemo(() => {
    if (!value) return options;
    const inOptions = options.some((o) => o.id === value);
    if (inOptions) return options;
    
    const cached = pickedBatches[value];
    return cached ? [cached, ...options] : options;
  }, [options, value, pickedBatches]);
  
  return (
    <BatchRegistryDropdown
      label="Select A Batch"
      value={value ?? ''}
      onChange={(id) => {
        onChange?.(id);
        if (!id) return;
        const picked = options.find((o) => o.id === id);
        if (picked) cachePickedBatch(picked);
      }}
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
      options={stickyOptions}
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
    grid: { xs: 12 },
    component: BatchIdCell,
  },
  {
    id: 'warehouseQuantity',
    label: 'Quantity',
    type: 'number',
    required: true,
    group: 'qty-fee',
    grid: { xs: 6 },
  },
  {
    id: 'warehouseFee',
    label: 'Warehouse Fee',
    type: 'number',
    required: false,
    group: 'qty-fee',
    placeholder: '$0.00',
    grid: { xs: 6 },
  },
  {
    id: 'inboundDate',
    label: 'Inbound Date',
    type: 'date',
    required: false,
    group: 'date-status',
    grid: { xs: 6 },
  },
  {
    id: 'statusId',
    label: 'Status',
    type: 'select',
    required: false,
    options: statusOptions,
    group: 'date-status',
    grid: { xs: 6 },
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
    createdCount,
    createWarehouseInventory,
    resetCreateState,
  } = useWarehouseInventoryCreate();
  
  const {
    items: batchRegistryOptions,
    loading: batchLookupLoading,
    error: batchLookupError,
    meta: batchLookupMeta,
    fetchLookup: fetchBatchRegistryLookup,
    resetLookup: resetBatchRegistryLookup,
  } = useBatchRegistryLookup();
  
  // ── Modal-level state ──────────────────────────────────────────────────────
  const [globalBatchType, setGlobalBatchType] = useState<BatchTypeFilter>('all');
  const [inputValues, setInputValues] = useState<string[]>([]);
  const [fetchParamsArray, setFetchParamsArray] = useState<
    BatchRegistryLookupQuery[]
  >([]);
  const [pickedBatches, setPickedBatches] = useState<
    Record<string, BatchRegistryLookupItem>
  >({});
  
  const cachePickedBatch = useCallback((item: BatchRegistryLookupItem) => {
    setPickedBatches((prev) =>
      prev[item.id] ? prev : { ...prev, [item.id]: item }
    );
  }, []);
  
  const defaultLookupQuery = useMemo<BatchRegistryLookupQuery>(
    () => ({
      keyword: '',
      limit: 10,
      offset: 0,
      warehouseId,
      ...(globalBatchType !== 'all' && { batchType: globalBatchType }),
    }),
    [warehouseId, globalBatchType]
  );
  
  const formRef = useRef<MultiItemFormRef>(null);
  const fetchRef = useRef(fetchBatchRegistryLookup);
  const resetRef = useRef(resetBatchRegistryLookup);
  fetchRef.current = fetchBatchRegistryLookup;
  resetRef.current = resetBatchRegistryLookup;
  
  // Initial fetch on open; cleanup on close
  useEffect(() => {
    if (!open) return;
    return () => {
      resetRef.current();
      setInputValues([]);
      setFetchParamsArray([]);
      setPickedBatches({});
    };
  }, [open]);
  
  useEffect(() => {
    if (!open) return;
    fetchRef.current(defaultLookupQuery);
  }, [open, defaultLookupQuery]);
  
  // ── Close handler — reset create slice in addition to local cleanup ────────
  const handleClose = useCallback(() => {
    resetCreateState();
    onClose();
  }, [resetCreateState, onClose]);
  
  const onSuccessRef = useRef(onSuccess);
  const handledResponseRef = useRef<unknown>(null);
  
  // ── Success handler — fire snackbar with createdCount, then close ──────────
  useEffect(() => {
    if (!createResponse?.success) return;
    if (handledResponseRef.current === createResponse) return;
    handledResponseRef.current = createResponse;
    
    const noun = globalBatchType === 'product' ? 'product' : 'packaging';
    const message = `Added ${createdCount} ${noun} record${
      createdCount === 1 ? '' : 's'
    }`;
    onSuccessRef.current?.(message);
    handleClose();
  }, [createResponse, createdCount, globalBatchType, handleClose]);
  
  // ── Type toggle — clear stale per-row state so fresh global type takes hold ─
  const handleBatchTypeChange = (
    _event: MouseEvent<HTMLElement>,
    next: BatchTypeFilter | null
  ) => {
    if (!next || next === globalBatchType) return;
    setGlobalBatchType(next);
  };
  
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
      globalBatchType,
      pickedBatches,
      cachePickedBatch,
    }),
    [
      inputValues,
      fetchParamsArray,
      batchRegistryOptions,
      batchLookupLoading,
      batchLookupError,
      batchLookupMeta,
      defaultLookupQuery,
      globalBatchType,
      pickedBatches,
      cachePickedBatch,
    ]
  );
  
  const onSubmit = (rows: Record<string, any>[]) => {
    void createWarehouseInventory(warehouseId, buildPayload(rows));
  };
  
  return (
    <CustomModal
      open={open}
      onClose={handleClose}
      title="Add Inventory Records"
      sx={{
        maxWidth: "md",
      }}
    >
      {createError && <ErrorMessage message={createError} />}
      
      <Box
        sx={{
          display: 'flex',
          flexDirection: 'column',
          maxHeight: '70vh',
        }}
      >
        {/* ── Modal-level controls (above scroll region) ───────────────── */}
        <Box
          sx={{
            display: 'flex',
            alignItems: 'center',
            gap: 2,
            mb: 2,
            pb: 2,
            borderBottom: 1,
            borderColor: 'divider',
          }}
        >
          <CustomTypography variant="body2" fontWeight={600}>
            Batch Type
          </CustomTypography>
          <ToggleButtonGroup
            value={globalBatchType}
            exclusive
            size="small"
            onChange={handleBatchTypeChange}
            disabled={createLoading}
          >
            <ToggleButton value="all">All</ToggleButton>
            <ToggleButton value="product">Product</ToggleButton>
            <ToggleButton value="packaging_material">
              Packaging Material
            </ToggleButton>
          </ToggleButtonGroup>
          <CustomTypography
            variant="caption"
            color="text.secondary"
            sx={{ ml: 'auto' }}
          >
            Applies to all new rows. Switching clears in-progress entries.
          </CustomTypography>
        </Box>
        
        {/* ── Scrollable form region ───────────────────────────────────── */}
        <Box sx={{ overflowY: 'auto', flex: 1, pr: 1 }}>
          <BatchLookupContext.Provider value={bundle}>
            <MultiItemForm
              ref={formRef}
              fields={fields}
              onSubmit={onSubmit}
              loading={createLoading}
              showSubmitButton={false}
              showAddButton
              showResetButton={false}
              getItemTitle={(index, item) => {
                const id = item?.batchId as string | undefined;
                const picked = id ? pickedBatches[id] : undefined;
                return picked ? composeBatchTitle(picked) : `Record ${index + 1}`;
              }}
            />
          </BatchLookupContext.Provider>
        </Box>
        
        {/* ── Sticky footer ────────────────────────────────────────────── */}
        <Box
          sx={{
            display: 'flex',
            justifyContent: 'flex-end',
            gap: 1,
            pt: 2,
            mt: 2,
            borderTop: 1,
            borderColor: 'divider',
          }}
        >
          <CustomButton
            variant="outlined"
            onClick={handleClose}
            disabled={createLoading}
          >
            Cancel
          </CustomButton>
          <CustomButton
            variant="contained"
            onClick={() => {
              const items = formRef.current?.getItems() ?? [];
              onSubmit(items);
            }}
            disabled={createLoading}
            loading={createLoading}
          >
            Submit All
          </CustomButton>
        </Box>
      </Box>
    </CustomModal>
  );
};

export default CreateInventoryModal;
