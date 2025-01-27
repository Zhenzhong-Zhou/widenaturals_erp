import { useProducts } from "../../../hooks";
import Container from "@mui/material/Container";
import Grid from "@mui/material/Grid2";
import { ProductCard } from "../index";
import { CustomPagination, ErrorDisplay, ErrorMessage, Loading } from "@components/index";
import { GeneralProductInfo } from "../state/productTypes.ts";

const ProductsPage = () => {
  const { products, pagination, loading, error, fetchProductsByPage } = useProducts<GeneralProductInfo>();
  const { page, totalPages, totalRecords, limit } = pagination;
  
  const handlePageChange = async (newPage: number) => {
    await fetchProductsByPage({ page: newPage, limit });
  };
  
  if (loading) return <Loading message="Loading all products..." />;
  if (error) return (
    <ErrorDisplay>
      <ErrorMessage message={error} />
    </ErrorDisplay>
  );
  
  return (
    <Container>
      <Grid container spacing={{ xs: 2, md: 3 }} columns={{ xs: 2, sm: 8, md: 12 }}>
        {products.map((product, index) => (
          <Grid key={index} size={{ xs: 2, sm: 4, md: 4 }}>
            <ProductCard product={product} />
          </Grid>
        ))}
      </Grid>
      
      <CustomPagination
        page={page}
        totalPages={totalPages}
        totalRecords={totalRecords}
        onPageChange={handlePageChange}
      />
    </Container>
  );
};

export default ProductsPage;
