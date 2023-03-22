import { Injectable } from "@angular/core";
import { HttpClient } from "@angular/common/http";
import { ToastrService } from "ngx-toastr";
import { ServiceService } from "../services/service.service";
import { Utils } from "../utils/util";

@Injectable({
  providedIn: "root",
})
export class ImagenesService {
  // IMAGEN LOGO
  urlImagen: string;
  nombreImagen: any[];
  constructor(
    private serviceService: ServiceService,
    private toastr: ToastrService,
    private http: HttpClient
  ) {}

  obtenerImagen() {
    return new Promise((resolve, reject) => {
      this.serviceService.getImagen().subscribe(
        (imagen: any) => {
          const nombreImagen = imagen.imagen;
          const urlImagen = "data:image/png;base64," + nombreImagen;
          resolve(urlImagen);
        },
        (error) => {
          reject(error);
        }
      );
    });
  }

  cargarImagen() {
    // CARGA LA IMAGEN EN UN OBJETO IMAGE
    let img = new Image();
    return new Promise((resolve, reject) => {
      img.onload = () => {
        // LA IMAGEN SE HA CARGADO CORRECTAMENTE
        Utils.getImageDataUrlFromLocalPath1(img.src).then(
          (result) => {
            resolve(result);
          },
          (error) => {
            reject(error);
          }
        );
      };
      img.onerror = () => {
        // OCURRIÓ UN ERROR AL CARGAR LA IMAGEN
        reject("Error al cargar la imagen");
      };
      this.obtenerImagen()
        .then((urlImagen: string) => {
          img.src = urlImagen;
        })
        .catch((error) => {
          reject(error);
        });
    });
  }
}
