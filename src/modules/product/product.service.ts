import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Product } from '../../entities/product.entity';
import { PaginatedResult } from '../../types/paginated';
import { GetProductsDTO } from './dto/get-products.dto';

@Injectable()
export class ProductService {
    constructor(
        @InjectRepository(Product)
        private readonly productRepository: Repository<Product>
    ) {}

    async getProductsByFilters(filters: GetProductsDTO): Promise<PaginatedResult<Product>> {
        const query = this.productRepository.createQueryBuilder('product');

        if (filters.id) {
            query.andWhere('product.id = :id', { id: filters.id });
        }

        if (filters.text) {
            query.andWhere('LOWER(product.name) LIKE LOWER(:text)', { text: `%${filters.text}%` });
        }

        if (filters.isActive !== undefined) {
            query.andWhere('product.is_active = :isActive', { isActive: filters.isActive });
        }

        // Get total count before applying pagination
        const itemCount = await query.getCount();

        // Calculate page count
        const pageSize = filters.pageSize || itemCount; // If no pageSize, assume all items on one page
        const pageCount = pageSize > 0 ? Math.ceil(itemCount / pageSize) : 0;

        query.orderBy('product.sequence', 'ASC');

        if (filters.pageSize) {
            query.skip((filters.pageIndex || 0) * filters.pageSize).take(filters.pageSize);
        }

        const items = await query.getMany();

        return { items, itemCount, pageCount };
    }
}
