import { Resolver, Query, Args } from '@nestjs/graphql';
import { ProductService } from './product.service';
import { Product } from '../../entities/product.entity';
import { UseGuards } from '@nestjs/common';
import { AuthGuard } from '../../providers/auth.guard';
import { Paginated, PaginatedResult } from '../../types/paginated';
import { GetLookupDTO } from '../../types/lookup.dto';

const PaginatedProduct = Paginated(Product);

@Resolver(() => Product)
@UseGuards(AuthGuard)
export class ProductResolver {
    constructor(private readonly productService: ProductService) {}

    @Query(() => PaginatedProduct, { nullable: true })
    async getProductsLookup(
        @Args('input', { type: () => GetLookupDTO, nullable: true })
        filters: GetLookupDTO
    ): Promise<PaginatedResult<Product>> {
        return this.productService.getProductsByFilters({
            ...(filters?.id && { id: filters.id }),
            ...(filters?.text && { text: filters.text }),
            ...(filters?.isActive !== undefined && { isActive: filters.isActive }),
            pageSize: filters?.pageSize || 10000,
            pageIndex: filters?.pageIndex || 0,
        });
    }
}
