import { Component } from "@angular/core";
import { ToastrService } from "ngx-toastr";
import { ServiceService } from "../../services/service.service";

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

  constructor(
    private toastr: ToastrService,
    private serviceService: ServiceService
  ) { }

  ngOnInit(): void {
    this.getMeta();
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
            "Se actualizará la página para aplicar el cambio",
            "La imagen se ha guardado correctamente",
            {
              timeOut: 6000,
            }
          );
          setTimeout(() => {
            location.reload();
          }, 6000);
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
}
