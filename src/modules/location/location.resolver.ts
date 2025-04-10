import { Resolver, Query, Args } from '@nestjs/graphql';
import { LocationService } from './location.service';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { District } from '../../entities/district.entity';
import { Country } from '../../entities/country.entity';
import { Location } from '../../entities/location.entity';
import { GetLocationsDTO } from './dto/get-locations.dto';

@Resolver()
export class LocationResolver {
    constructor(private readonly locationService: LocationService) {}

    @Query(() => [Country])
    async getCountries(@Args('text', { nullable: true }) text?: string): Promise<Country[]> {
        return this.locationService.getCountries(text);
    }

    @Query(() => [City])
    async getCities(
        @Args('countryId', { nullable: true }) countryId?: string,
        @Args('text', { nullable: true }) text?: string
    ): Promise<City[]> {
        return this.locationService.getCities(countryId ? countryId : '9031e567-8901-2345-da62-812329101923', text);
    }

    @Query(() => [County])
    async getCounties(
        @Args('cityId') cityId?: string,
        @Args('text', { nullable: true }) text?: string
    ): Promise<County[]> {
        return this.locationService.getCounties(cityId, text);
    }

    @Query(() => [District])
    async getDistricts(
        @Args('countyId') countyId?: string,
        @Args('text', { nullable: true }) text?: string
    ): Promise<District[]> {
        return this.locationService.getDistricts(countyId, text);
    }

    @Query(() => [Location])
    async getLocations(@Args('input', { nullable: true }) input?: GetLocationsDTO): Promise<Location[]> {
        return this.locationService.getLocations(input || {});
    }

    @Query(() => [Location])
    async getLocationsLookup(@Args('text', { nullable: true }) text?: string): Promise<Location[]> {
        return this.locationService.getLocations({ text });
    }
}
