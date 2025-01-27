import { useProducts } from "../../../hooks";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import { ProductCard } from "../index";
import { CustomPagination } from "@components/index";
import { GeneralProductInfo } from '../state/productTypes.ts';

const ProductsPage = () => {
  const { products, pagination, loading, error, fetchProductsByPage } = useProducts<GeneralProductInfo>({
    initialPage: 1,
    itemsPerPage: 10,
  });
  
  const handlePageChange = (newPage: number) => {
    fetchProductsByPage(newPage);
  };
  
  if (loading) return <p>Loading...</p>;
  if (error) return <p>Error: {error}</p>;
  
  return (
    <Container>
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 4, sm: 8, md: 12 }}>
        {products.map((product, index) => (
          <Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      
      <CustomPagination
        page={pagination.page}
        totalPages={pagination.totalPages}
        totalRecords={pagination.totalRecords}
        onPageChange={handlePageChange}
        itemsPerPage={pagination.limit}
      />
    </Container>
  );
};

export default ProductsPage;
