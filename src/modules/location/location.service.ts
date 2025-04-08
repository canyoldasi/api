import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { District } from '../../entities/district.entity';
import { Country } from '../../entities/country.entity';
import { Location } from '../../entities/location.entity';
import { GetLocationsDTO } from './dto/get-locations.dto';

@Injectable()
export class LocationService {
    constructor(
        @InjectRepository(City)
        private readonly cityRepository: Repository<City>,
        @InjectRepository(County)
        private readonly countyRepository: Repository<County>,
        @InjectRepository(District)
        private readonly districtRepository: Repository<District>,
        @InjectRepository(Country)
        private readonly countryRepository: Repository<Country>,
        @InjectRepository(Location)
        private readonly locationRepository: Repository<Location>
    ) {}

    async getCountries(text?: string): Promise<Country[]> {
        const query = this.countryRepository.createQueryBuilder('country');

        if (text) {
            query.where('LOWER(country.name) LIKE LOWER(:text)', { text: `%${text}%` });
        }

        return query.orderBy('country.name', 'ASC').getMany();
    }

    async getCities(countryId: string = '9031e567-8901-2345-da62-812329101923', text?: string): Promise<City[]> {
        const query = this.cityRepository.createQueryBuilder('city');

        if (text) {
            query.where('LOWER(city.name) LIKE LOWER(:text)', { text: `%${text}%` });
        }

        query.andWhere('city.countryId = :countryId', { countryId });
        return query.orderBy('city.name', 'ASC').getMany();
    }

    async getCity(id: string): Promise<City> {
        return this.cityRepository.findOne({
            where: { id },
            relations: ['counties'],
        });
    }

    async getCounty(id: string): Promise<County> {
        return this.countyRepository.findOne({
            where: { id },
            relations: ['city'],
        });
    }

    async getCounties(cityId?: string, text?: string): Promise<County[]> {
        const query = this.countyRepository.createQueryBuilder('county');

        if (text) {
            query.where('LOWER(county.name) LIKE LOWER(:text)', { text: `%${text}%` });
        }

        if (cityId) {
            query.andWhere('county.cityId = :cityId', { cityId });
        }

        return query.orderBy('county.name', 'ASC').getMany();
    }

    async getDistricts(countyId?: string, text?: string): Promise<District[]> {
        const query = this.districtRepository
            .createQueryBuilder('district')
            .leftJoinAndSelect('district.county', 'county');

        if (text) {
            query.where('LOWER(district.name) LIKE LOWER(:text)', { text: `%${text}%` });
        }

        if (countyId) {
            query.andWhere('district.countyId = :countyId', { countyId });
        }

        return query.orderBy('district.name', 'ASC').getMany();
    }

    async getLocations(input: GetLocationsDTO): Promise<Location[]> {
        const query = this.locationRepository.createQueryBuilder('location');

        if (input.text) {
            query.where('(LOWER(location.name) LIKE LOWER(:text) OR LOWER(location.address) LIKE LOWER(:text))', {
                text: `%${input.text}%`,
            });
        }

        return query
            .andWhere('location.isActive = :isActive', { isActive: true })
            .orderBy('location.name', 'ASC')
            .getMany();
    }
}
