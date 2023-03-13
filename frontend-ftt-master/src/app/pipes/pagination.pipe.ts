import { Pipe, PipeTransform } from '@angular/core';

@Pipe({ name: 'pagination' })
export class PaginationPipe implements PipeTransform {
    transform(value: any[], page): any {
        return [...value.slice(3 * (page), 3 * (page + 1))]
    }
}