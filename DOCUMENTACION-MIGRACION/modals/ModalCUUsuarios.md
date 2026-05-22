# Modal: ModalCUUsuarios

## Descripción General
Modal completo para crear y editar usuarios del sistema con validación de RUT chileno y políticas de contraseña segura.

## Ubicación
`src/components/ui/modals/ModalCUUsuarios.jsx`

## Tipo de Componente
**forwardRef** con **useImperativeHandle**

## Estructura del Componente

### Estado
```javascript
const [loadingScreenC, setLoadingScreenC] = useState(true)
const [open, setOpen] = useState(false)

// Campos del formulario
const [nombre, setNombre] = useState("")
const [apellido, setApellido] = useState("")
const [tipoCuenta, setTipoCuenta] = useState(undefined)
const [contraseña, setContraseña] = useState("")
const [rut, setRut] = useState("")
const [email, setEmail] = useState("")
const [departamento, setDepartamento] = useState(undefined)
const [validRut, setValidRut] = useState(true)

const [isEdit, setIsEdit] = useState(false)
const [idUsuario, setIdUsuario] = useState("")
const [buttonEstado, setButtonEstado] = useState(false)

// Validación de contraseña segura
const [caracteres, setCaracteres] = useState(false)
const [mayusMinus, setMayusMinus] = useState(false)
const [numeros, setNumeros] = useState(false)
const [simbolos, setSimbolos] = useState(false)
```

## Funcionalidades Principales

### 1. Carga de Datos para Edición

```javascript
const childFunction = async (id, action) => {
    setOpen(true)
    setCaracteres(false)
    setMayusMinus(false)
    setNumeros(false)
    setSimbolos(false)
    setValidRut(true)
    
    if (action === "Edit") {
        setLoadingScreenC(true)
        setIsEdit(true)
        
        await axiosInstance.get("/api/getUserId/" + id)
            .then((response) => {
                setNombre(response.data["name"])
                setApellido(response.data["lastname"])
                setTipoCuenta(response.data["type_account"])
                setRut(response.data["rut"])
                setEmail(response.data["email"])
                setDepartamento(response.data["departamento"])
                setIdUsuario(id)
            })
            .finally(() => {
                setLoadingScreenC(false)
            })
    } else {
        setIsEdit(false)
        cleanInputs()
        setLoadingScreenC(false)
    }
}
```

### 2. Validación de RUT Chileno

```javascript
import { validateRut, formatRut } from "rutlib"

const handleRutChange = (e) => {
    let rawRut = e.target.value
    rawRut = formatRut(rawRut, false) // Formatea automáticamente
    setRut(rawRut)
    const isValid = validateRut(rawRut)
    
    if (rawRut.length < 8) {
        setValidRut(false)
    } else {
        setValidRut(isValid)
    }
}
```

**Características**:
- Formateo automático mientras se escribe
- Validación en tiempo real
- Indicador visual de validez
- Longitud mínima de 8 caracteres

### 3. Validación de Contraseña Segura

```javascript
const handleContraseñaChange = (e) => {
    let rawContraseña = e.target.value
    setContraseña(rawContraseña)
    
    // 1. Mínimo 6 caracteres
    if (rawContraseña.length >= 6) {
        setCaracteres(true)
    } else {
        setCaracteres(false)
    }
    
    // 2. Mayúsculas y Minúsculas
    if (rawContraseña !== rawContraseña.toUpperCase() &&
        rawContraseña !== rawContraseña.toLowerCase()) {
        setMayusMinus(true)
    } else {
        setMayusMinus(false)
    }
    
    // 3. Números
    if (/[1-9]/.test(rawContraseña)) {
        setNumeros(true)
    } else {
        setNumeros(false)
    }
    
    // 4. Símbolos
    if (/[!@#$%^&*()_+\-=\[\]{};':"\\|,.<>\/?]+/.test(rawContraseña)) {
        setSimbolos(true)
    } else {
        setSimbolos(false)
    }
}
```

**Requisitos de Contraseña**:
- ✓ Mínimo 6 caracteres
- ✓ Mayúsculas y minúsculas
- ✓ Al menos un número
- ✓ Al menos un símbolo

### 4. Creación de Usuario

```javascript
async function createUsuario() {
    // Validaciones
    if (nombre === "") {
        return message.error(`Ingrese un nombre válido`)
    }
    if (apellido === "") {
        return message.error(`Ingrese un apellido válido`)
    }
    if (!validRut || rut === "") {
        return message.error(`Ingrese una rut válido`)
    }
    if (email === "") {
        return message.error(`Ingrese un email válido`)
    }
    if (tipoCuenta === "" || tipoCuenta === null || tipoCuenta === undefined) {
        return message.error(`Ingrese un tipo de cuenta válido`)
    }
    if (contraseña === "") {
        return message.error(`Ingrese una contraseña válida`)
    }
    
    // Validar requisitos de contraseña
    if (!caracteres || !mayusMinus || !numeros || !simbolos) {
        return message.error(`Ingrese una contraseña que cumpla los requisitos`)
    }
    
    if (departamento === undefined || departamento === "") {
        return message.error(`Ingrese un departamento`)
    }
    
    setLoadingScreenC(true)
    setButtonEstado(true)
    
    const formData = new FormData()
    formData.append("name", nombre)
    formData.append("lastname", apellido)
    formData.append("type_account", tipoCuenta)
    formData.append("password", contraseña)
    formData.append("password_confirmation", contraseña)
    formData.append("rut", rut)
    formData.append("email", email)
    formData.append("departamento", departamento)
    
    await axiosInstance.post("/api/register", formData)
        .then((response) => {
            message.success(`El usuario se ha guardado correctamente.`)
            setOpen(false)
            props.reloadTable()
        })
        .catch((error) => {
            message.error(`El usuario no ha podido guardarse.`)
        })
        .finally(() => {
            cleanInputs()
            setLoadingScreenC(false)
            setButtonEstado(false)
        })
}
```

### 5. Actualización de Usuario

```javascript
async function updateUsuario() {
    // Validaciones (sin contraseña requerida)
    if (nombre === "") {
        return message.error(`Ingrese un nombre válido`)
    }
    if (apellido === "") {
        return message.error(`Ingrese un apellido válido`)
    }
    if (tipoCuenta === "") {
        return message.error(`Ingrese un tipo de cuenta válido`)
    }
    if (departamento === undefined || departamento === "") {
        return message.error(`Ingrese un departamento`)
    }
    
    // Si ingresó contraseña, validar requisitos
    if (contraseña !== "") {
        if (!caracteres) {
            return message.error(`Ingrese una contraseña que cumpla los requisitos`)
        }
    }
    
    const formData = new FormData()
    formData.append("name", nombre)
    formData.append("lastname", apellido)
    formData.append("type_account", tipoCuenta)
    formData.append("departamento", departamento)
    
    // Contraseña opcional al editar
    if (contraseña != "") {
        formData.append("password", contraseña)
    }
    
    setButtonEstado(true)
    setLoadingScreenC(true)
    
    await axiosInstance.put("/api/updateUser/" + idUsuario, formData)
        .then((response) => {
            message.success(`El usuario se ha actualizado correctamente.`)
            setOpen(false)
            props.reloadTable()
        })
        .catch((error) => {
            message.error(`El usuario no ha podido actualizarse.`)
        })
        .finally(() => {
            cleanInputs()
            setButtonEstado(false)
            setLoadingScreenC(false)
        })
}
```

## Campos del Formulario

### 1. Nombre
```javascript
<Text style={{ fontWeight: "600" }}>Nombre</Text>
<Input
    placeholder="Ingresa nombre"
    value={nombre}
    onChange={(event) => setNombre(event.target.value)}
    type="text"
/>
```

### 2. Apellido
```javascript
<Text style={{ fontWeight: "600", marginTop: 10 }}>Apellido</Text>
<Input
    placeholder="Ingresa apellido"
    value={apellido}
    onChange={(event) => setApellido(event.target.value)}
    type="text"
/>
```

### 3. RUT (con validación)
```javascript
<Text style={{ fontWeight: "600", marginTop: 10 }}>Rut</Text>
<Input
    placeholder="Ingresa Rut"
    value={rut}
    onChange={handleRutChange}
    type="text"
    disabled={isEdit ? true : false} // No editable al actualizar
    maxLength={12}
    minLength={9}
/>

{!validRut ? (
    <Alert
        style={{ marginTop: 15 }}
        message="Rut inválido"
        type="error"
    />
) : null}
```

### 4. Correo Electrónico
```javascript
<Text style={{ fontWeight: "600", marginTop: 10 }}>Correo Electrónico</Text>
<Input
    placeholder="Ingresa correo electronico"
    value={email}
    onChange={(event) => setEmail(event.target.value)}
    type="email"
    disabled={isEdit ? true : false} // No editable al actualizar
/>
```

### 5. Departamento
```javascript
<Text style={{ fontWeight: "600", marginTop: 10 }}>Departamento</Text>
<Select
    defaultValue={departamento}
    style={{ width: "100%" }}
    placeholder="Seleccione algún departamento"
    onChange={(e) => setDepartamento(e)}
    options={[
        { value: "RR.HH", label: "RR.HH" },
        { value: "Contabilidad", label: "Contabilidad" },
        { value: "Abastecimiento", label: "Abastecimiento" },
        { value: "Juridico", label: "Juridico" },
    ]}
/>
```

### 6. Tipo de Cuenta
```javascript
<Text style={{ fontWeight: "600", marginTop: 10 }}>Tipo de Cuenta</Text>
<Select
    defaultValue={tipoCuenta}
    style={{ width: "100%" }}
    placeholder="Seleccione algún tipo de cuenta"
    onChange={(e) => setTipoCuenta(e)}
    options={[
        { value: "Secretaria Abastecimiento", label: "Secretaria Abastecimiento" },
        { value: "Licitador", label: "Licitador" },
        { value: "Secretario Juridico", label: "Secretario Juridico" },
        { value: "Presupuesto", label: "Presupuesto" },
        { value: "Subdireccion Administrativa", label: "Subdireccion Administrativa" },
        { value: "Super Admin", label: "Super Admin" },
    ]}
/>
```

### 7. Contraseña (solo al crear)
```javascript
{!isEdit ? (
    <>
        <Text style={{ fontWeight: "600", marginTop: 10 }}>Contraseña</Text>
        <Input.Password
            placeholder="Ingresa contraseña"
            value={contraseña}
            onChange={handleContraseñaChange}
            type="text"
        />
        
        <div style={{ marginTop: "20px", fontFamily: "Greycliff CF, Arial, sans-serif" }}>
            <p style={{ margin: "0", marginTop: "5px", marginBottom: "5px" }}>
                Ingresa estos parametros para una clave segura:
            </p>
            
            <div className="requisitos-pass" style={{ display: "flex", alignItems: "center" }}>
                {caracteres ? (
                    <IconCheck style={{ color: "green" }} />
                ) : (
                    <IconX style={{ color: "red" }} />
                )}
                6 caracteres como mínimo
            </div>
            
            <div className="requisitos-pass" style={{ display: "flex", alignItems: "center" }}>
                {mayusMinus ? (
                    <IconCheck style={{ color: "green" }} />
                ) : (
                    <IconX style={{ color: "red" }}></IconX>
                )}
                Uso de mayúsculas y minúsculas
            </div>
            
            <div className="requisitos-pass" style={{ display: "flex", alignItems: "center" }}>
                {numeros ? (
                    <IconCheck style={{ color: "green" }} />
                ) : (
                    <IconX style={{ color: "red" }}></IconX>
                )}
                Uso de números
            </div>
            
            <div className="requisitos-pass" style={{ display: "flex", alignItems: "center" }}>
                {simbolos ? (
                    <IconCheck style={{ color: "green" }} />
                ) : (
                    <IconX style={{ color: "red" }}></IconX>
                )}
                Uso de símbolos ( ejem. @#$% )
            </div>
        </div>
    </>
) : null}
```

## Validaciones

### Al Crear
1. ✓ Nombre requerido
2. ✓ Apellido requerido
3. ✓ RUT válido y requerido
4. ✓ Email requerido
5. ✓ Tipo de cuenta requerido
6. ✓ Contraseña con todos los requisitos
7. ✓ Departamento requerido

### Al Editar
1. ✓ Nombre requerido
2. ✓ Apellido requerido
3. ✓ RUT no editable
4. ✓ Email no editable
5. ✓ Tipo de cuenta requerido
6. ✓ Contraseña opcional (solo si se quiere cambiar)
7. ✓ Departamento requerido

## Roles del Sistema

- **Secretaria Abastecimiento**: Gestión de PAC y requerimientos
- **Licitador**: Creación y gestión de licitaciones
- **Secretario Juridico**: Revisión legal
- **Presupuesto**: Revisión presupuestaria
- **Subdireccion Administrativa**: Aprobaciones administrativas
- **Super Admin**: Acceso total

## Departamentos

- **RR.HH**: Recursos Humanos
- **Contabilidad**: Departamento de contabilidad
- **Abastecimiento**: Gestión de abastecimiento
- **Juridico**: Departamento jurídico

## API Endpoints

### GET
- `/api/getUserId/:id`: Obtiene usuario por ID

### POST
- `/api/register`: Crea nuevo usuario

### PUT
- `/api/updateUser/:id`: Actualiza usuario

## Skeleton Loading

```javascript
function SkeletonsLoading() {
    return (
        <SimpleGrid cols={1}>
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
            <Skeleton.Input style={{ width: "100%" }} />
        </SimpleGrid>
    )
}
```

## Props

```javascript
{
    reloadTable: Function // Callback para recargar tabla de usuarios
}
```

## Consideraciones para Migración

1. **Validación de Email**: Agregar validación de formato
2. **Fortaleza de Contraseña**: Indicador visual de fortaleza
3. **Generador de Contraseñas**: Botón para generar contraseña segura
4. **2FA**: Autenticación de dos factores
5. **Roles Dinámicos**: Cargar desde configuración
6. **Departamentos Dinámicos**: Cargar desde API
7. **Avatar**: Permitir subir foto de perfil
8. **Múltiples Emails**: Permitir email secundario
9. **Teléfono**: Agregar campo de teléfono
10. **Fecha de Nacimiento**: Para estadísticas
11. **Firma Digital**: Para documentos
12. **Notificaciones**: Configurar preferencias

## Dependencias Críticas

```json
{
  "react": "^18.0.0",
  "@mantine/core": "^5.0.0",
  "antd": "^5.0.0",
  "@tabler/icons-react": "^2.0.0",
  "rutlib": "^2.0.0",
  "axios": "^1.0.0"
}
```
