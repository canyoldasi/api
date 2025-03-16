import { Resolver, Query, Args } from '@nestjs/graphql';
import { LocationService } from './location.service';
import { City } from '../../entities/city.entity';
import { County } from '../../entities/county.entity';
import { District } from '../../entities/district.entity';
import { Country } from '../../entities/country.entity';

@Resolver()
export class LocationResolver {
    constructor(private readonly locationService: LocationService) {}

    @Query(() => [Country])
    async getCountries(@Args('text', { nullable: true }) text?: string): Promise<Country[]> {
        return this.locationService.getCountries(text);
    }

    @Query(() => [City])
    async getCities(
        @Args('countryId') countryId?: string,
        @Args('text', { nullable: true }) text?: string
    ): Promise<City[]> {
        return this.locationService.getCities(countryId, text);
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
}
