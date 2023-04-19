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
  marca: string;

  constructor(
    private toastr: ToastrService,
    private serviceService: ServiceService
  ) {}

  ngOnInit(): void {
    this.getMeta();
    this.getMarca();
  }

  onFileSelected(event) {
    this.file = event.target.files[0];
    if (this.file) {
      const reader = new FileReader();
      reader.readAsDataURL(this.file);
      reader.onload = () => {
        this.imageUrl = reader.result as string;
      };
    }
  }

  guardarImagen() {
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
    this.serviceService.setMarca(this.marca).subscribe(
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
