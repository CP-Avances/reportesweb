import { Router } from '@angular/router';
import { Component } from "@angular/core";
import { ToastrService } from "ngx-toastr";

import { ServiceService } from "../../services/service.service";
import { AuthenticationService } from '../../services/authentication.service';

@Component({
  selector: "app-configuracion",
  templateUrl: "./configuracion.component.html",
  styleUrls: ["./configuracion.component.scss"],
})

export class ConfiguracionComponent {
  imageUrl: string;
  file: File;
  logo: any;
  nombreImagen: any[];
  valor: number;
  marca: string = " ";
  desactivarMarca = false;

  constructor(
    private auth: AuthenticationService,
    private router: Router,
    private toastr: ToastrService,
    private serviceService: ServiceService,
  ) { }

  ngOnInit(): void {
    this.getMeta();
    this.getMarca();
  }

  verificador: number = 0;
  onFileSelected(event: any) {
    this.file = event.target.files[0];
    if (this.file) {
      const name = this.file.name;
      let arrayItems = name.split(".");
      let itemExtencion = arrayItems[arrayItems.length - 1];
      if (this.file.size <= 2e+6) {
        if (itemExtencion == 'png' || itemExtencion == 'jpg' ||
          itemExtencion == 'jpeg' || itemExtencion == 'gif') {
          const reader = new FileReader();
          reader.readAsDataURL(this.file);
          reader.onload = () => {
            this.imageUrl = reader.result as string;
          };
          this.verificador = 0;
        }
        else {
          this.toastr.warning('Formatos aceptados .png, .jpg, .gif y .jpeg.', 'Error formato del archivo.', {
            timeOut: 6000,
          });
          this.verificador = 1;
        }
      }
      else {
        this.toastr.info('El archivo ha excedido el tamaño permitido.', 'Tamaño de archivos permitido máximo 2MB.', {
          timeOut: 6000,
        });
        this.verificador = 1;
      }
    }
  }

  guardarImagen() {
    if (this.verificador != 1) {
      const formData = new FormData();
      formData.append("image", this.file, this.file.name);
      this.serviceService.setImagen(formData).subscribe(
        (res) => {
          // SE INFORMA QUE SE PUDO GUARDO LA IMAGEN
          this.toastr.success(
            `Para asegurar la correcta implementación de los cambios, se procederá a cerrar la sesión. 
            Será necesario volver a acceder al sistema.`,
            "La imagen se ha guardado correctamente",
            {
              timeOut: 2000,
            }
          );
          setTimeout(() => {
            this.auth.logout();
            this.router.navigateByUrl('/');
          }, 2000);
        },
        (error) => {
          // SE INFORMA QUE NO SE GUARDO LA IMAGEN
          this.toastr.error("Error al guardar la imagen.", "Upss !!!.", {
            timeOut: 6000,
          });
        }
      );
    }
  }

  guardarMeta() {
    this.serviceService.setMeta(this.valor).subscribe(
      (res) => {
        // SE INFORMA QUE SE PUDO GUARDO LA IMAGEN
        this.toastr.success(
          "Exito",
          "El valor se ha guardado correctamente",
          {
            timeOut: 6000,
          }
        );
      },
      (error) => {
        // SE INFORMA QUE NO SE GUARDO LA IMAGEN
        this.toastr.error("Error al guardar el valor.", "Upss !!!.", {
          timeOut: 6000,
        });
      }
    );
  }

  getMeta() {
    this.serviceService.getMeta().subscribe((valor: any) => {
      this.valor = valor.valor;
    });
  }

  guardarMarca() {
    let marcaAux: string = " ";
    if (this.desactivarMarca) {
      marcaAux = "desactivar";
    } else {
      marcaAux = this.marca;
    }

    this.serviceService.setMarca(marcaAux).subscribe(
      (res) => {
        // SE INFORMA QUE SE PUDO GUARDO LA IMAGEN
        this.toastr.success(
          "Exito",
          "La marcar de agua se ha guardado correctamente",
          {
            timeOut: 6000,
          }
        );
      },
      (error) => {
        // SE INFORMA QUE NO SE GUARDO LA IMAGEN
        this.toastr.error("Error al guardar la marca de agua.", "Upss !!!.", {
          timeOut: 6000,
        });
      }
    );
  }

  getMarca() {
    this.serviceService.getMarca().subscribe((marca: any) => {
      this.marca = marca.marca;
    });
  }
}
