import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'filter'
})
export class FilterPipe implements PipeTransform {

  transform(value: any, arg: any): any {

    /* if(args === '' || args.length < 3) return value; */
    const resultPosts = [];
    for(const servicio1 of value){

      if(servicio1.usuario.indexOf(arg) > -1){
        resultPosts.push(servicio1);
      }

    }
    return resultPosts;



  }

}

