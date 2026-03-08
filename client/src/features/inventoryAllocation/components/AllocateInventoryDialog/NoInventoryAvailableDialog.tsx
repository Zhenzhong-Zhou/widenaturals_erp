import type { FC } from 'react'
import Table from '@mui/material/Table'
import TableHead from '@mui/material/TableHead'
import TableRow from '@mui/material/TableRow'
import TableCell from '@mui/material/TableCell'
import TableBody from '@mui/material/TableBody'
import Divider from '@mui/material/Divider'
import Stack from '@mui/material/Stack'
import { CustomDialog, CustomTypography } from '@components/index'

interface NoInventoryItem {
  itemCode: string
  itemName: string
  requestedQuantity: number
}

interface NoInventoryAvailableDialogProps {
  open: boolean
  items: NoInventoryItem[]
  onClose: () => void
}

const NoInventoryAvailableDialog: FC<NoInventoryAvailableDialogProps> = ({
                                                                           open,
                                                                           items,
                                                                           onClose
                                                                         }) => {
  return (
    <CustomDialog
      open={open}
      onClose={onClose}
      title="No Inventory Available"
      confirmButtonText="Close"
      onConfirm={onClose}
    >
      <Stack spacing={2}>
        
        <CustomTypography>
          No inventory batches exist in the selected warehouse for the following items.
        </CustomTypography>
        
        <Divider />
        
        <CustomTypography variant="subtitle2">
          Items Without Inventory
        </CustomTypography>
        
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell>Item Code</TableCell>
              <TableCell>Item Name</TableCell>
              <TableCell align="right">Requested</TableCell>
            </TableRow>
          </TableHead>
          
          <TableBody>
            {items.map((item, index) => (
              <TableRow key={index}>
                
                <TableCell>
                  {item.itemCode}
                </TableCell>
                
                <TableCell>
                  {item.itemName}
                </TableCell>
                
                <TableCell align="right">
                  {item.requestedQuantity}
                </TableCell>
              
              </TableRow>
            ))}
          </TableBody>
        </Table>
        
        <Divider />
        
        <CustomTypography>
          Please select another warehouse or proceed with manual allocation.
        </CustomTypography>
      
      </Stack>
    </CustomDialog>
  )
}

export default NoInventoryAvailableDialog;
