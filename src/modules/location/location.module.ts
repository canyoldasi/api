import { Module } from '@nestjs/common';
import { TypeOrmModule } from '@nestjs/typeorm';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { Country } from '../../entities/country.entity';
import { District } from '../../entities/district.entity';
import { LocationService } from './location.service';
import { LocationResolver } from './location.resolver';

@Module({
    imports: [TypeOrmModule.forFeature([City, County, Country, District])],
    providers: [LocationService, LocationResolver],
    exports: [LocationService],
})
export class LocationModule {}
