import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { Product } from '../../entities/product.entity';
import { ProductService } from './product.service';
import { ProductResolver } from './product.resolver';
import { UserService } from '../user/user.service';

@Module({
    imports: [TypeOrmModule.forFeature([Product])],
    providers: [ProductService, ProductResolver, UserService],
    exports: [ProductService],
})
export class ProductModule {}
