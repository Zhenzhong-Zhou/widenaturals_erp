import type { FC } from 'react'
import Table from '@mui/material/Table';
import TableHead from '@mui/material/TableHead';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import TableBody from '@mui/material/TableBody';
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { CustomDialog, CustomTypography } from '@components/index';


interface PartialAllocationItem {
  itemName: string
  requestedQuantity: number
  allocatedQuantity: number
  missingQuantity: number
}

interface PartialAllocationConfirmDialogProps {
  open: boolean
  items: PartialAllocationItem[]
  onCancel: () => void
  onConfirm: () => void
}

const PartialAllocationConfirmDialog: FC<PartialAllocationConfirmDialogProps> = ({
                                                                                   open,
                                                                                   items,
                                                                                   onCancel,
                                                                                   onConfirm
                                                                                 }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onCancel}
      title="Partial Allocation Confirmation"
      showCancelButton
      confirmButtonText="Allocate Available Inventory"
      onConfirm={onConfirm}
    >
      <Stack spacing={2}>
        <CustomTypography>
          Some items cannot be fully allocated.
        </CustomTypography>
        
        <Divider />
        
        <CustomTypography variant="subtitle2">
          Inventory Shortage
        </CustomTypography>
        
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item</TableCell>
              <TableCell align="right">Requested</TableCell>
              <TableCell align="right">Available</TableCell>
              <TableCell align="right">Missing</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                <TableCell>{item.itemName}</TableCell>
                
                <TableCell align="right">
                  {item.requestedQuantity}
                </TableCell>
                
                <TableCell align="right">
                  {item.allocatedQuantity}
                </TableCell>
                
                <TableCell align="right">
                  {item.missingQuantity}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Divider />
        
        <CustomTypography>
          Do you want to allocate the available inventory only?
        </CustomTypography>
      </Stack>
    </CustomDialog>
  )
}

export default PartialAllocationConfirmDialog;
