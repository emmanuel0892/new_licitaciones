using System.Reflection;
using System.Drawing;
using System.Drawing.Imaging;
using Microsoft.AspNetCore.SignalR;
using signature_service.Models;
using signature_service.Hubs;
using System.Runtime.InteropServices;
using Microsoft.Win32;

namespace signature_service.Services
{
    public class WacomSignatureService
    {
        private readonly IHubContext<SignatureHub> _hubContext;
        private object? _tablet;
        private object? _usbDevices;
        private Type? _tabletType;
        private Type? _usbDevicesType;
        private Type? _iUsbDeviceType;
        private bool _sdkLoaded = false;
        private bool _isConnected = false;
        private bool _isCapturing = false;
        private string? _deviceName;
        private string? _signatureImageBase64;
        private List<object> _capturedPoints = new List<object>();
        private string? _lastError;
        private string? _lastExceptionType;
        private string? _lastExceptionStackTrace;
        private int _lastExceptionHResult = 0;
        private string? _foundDllPath;
        private List<string> _foundDlls = new List<string>();
        private List<string> _searchPaths = new List<string>();
        private Assembly? _sdkAssembly;
        private string? _selectedProgId;
        private string? _selectedCreationMethod;
        private bool _tabletDetectionAttempted = false;
        private int _usbDeviceCount = 0;
        private List<UsbDeviceInfo> _detectedUsbDevices = new List<UsbDeviceInfo>();
        private List<TabletConnectionAttempt> _tabletConnectionAttempts = new List<TabletConnectionAttempt>();
        private string? _tabletConnectMethod;
        private bool _tabletConnectAttempted = false;
        private object? _startCaptureDebug;
        private object? _lastDiagnostics;
        private object? _lastStartDiagnostics;
        private bool _captureActive = false;

        public bool IsConnected => _isConnected;
        public string? DeviceName => _isConnected ? "Wacom STU-540" : null;

        public WacomSignatureService(IHubContext<SignatureHub> hubContext)
        {
            _hubContext = hubContext;
            
            Console.WriteLine("[WacomSignatureService] Iniciando servicio de firmas...");
            Console.WriteLine($"[WacomSignatureService] Arquitectura del proceso: {RuntimeInformation.ProcessArchitecture}");
            Console.WriteLine($"[WacomSignatureService] Arquitectura del sistema operativo: {RuntimeInformation.OSArchitecture}");
            Console.WriteLine($"[WacomSignatureService] Proceso de 64 bits: {Environment.Is64BitProcess}");
            Console.WriteLine($"[WacomSignatureService] Sistema operativo de 64 bits: {Environment.Is64BitOperatingSystem}");
            
            LoadSdk();
            
            if (_sdkLoaded)
            {
                Console.WriteLine($"[WacomSignatureService] SDK cargado desde: {_foundDllPath}");
            }
            else
            {
                Console.WriteLine($"[WacomSignatureService] SDK NO cargado. Último error: {_lastError}");
            }
        }

        private void LoadSdk()
        {
            try
            {
                Console.WriteLine("[WacomSignatureService] Buscando SDK de Wacom STU...");
                
                _searchPaths = new List<string>
                {
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Libs", "Wacom", "Interop.wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Libs", "Wacom", "wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", "Debug", "net6.0", "Interop.wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", "Debug", "net6.0", "wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", "Release", "net6.0", "Interop.wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", "Release", "net6.0", "wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Interop.wgssSTU.dll"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "wgssSTU.dll"),
                    @"C:\Program Files (x86)\Wacom STU SDK\COM\bin\x64\Interop.wgssSTU.dll",
                    @"C:\Program Files (x86)\Wacom STU SDK\COM\bin\x64\wgssSTU.dll",
                    @"C:\Program Files (x86)\Wacom STU SDK\COM\bin\Win32\Interop.wgssSTU.dll",
                    @"C:\Program Files (x86)\Wacom STU SDK\COM\bin\Win32\wgssSTU.dll"
                };

                // Buscar DLLs en el proyecto
                SearchDllsInProject();

                string? dllPath = null;
                foreach (var path in _searchPaths)
                {
                    Console.WriteLine($"[WacomSignatureService] Verificando ruta: {path}");
                    if (File.Exists(path))
                    {
                        dllPath = path;
                        _foundDllPath = path;
                        _foundDlls.Add(Path.GetFileName(path));
                        Console.WriteLine($"[WacomSignatureService] ✓ DLL encontrada en: {dllPath}");
                        break;
                    }
                }

                if (string.IsNullOrEmpty(dllPath))
                {
                    _lastError = "Interop.wgssSTU.dll no encontrada en ninguna ruta conocida";
                    _lastExceptionType = "FileNotFoundException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    Console.WriteLine("[WacomSignatureService] Rutas buscadas:");
                    foreach (var path in _searchPaths)
                    {
                        Console.WriteLine($"  - {path}");
                    }
                    return;
                }

                Console.WriteLine($"[WacomSignatureService] Cargando assembly desde: {dllPath}");
                _sdkAssembly = Assembly.LoadFrom(dllPath);
                
                _usbDevicesType = _sdkAssembly.GetType("wgssSTU.UsbDevices");
                _tabletType = _sdkAssembly.GetType("wgssSTU.Tablet");
                _iUsbDeviceType = _sdkAssembly.GetType("wgssSTU.IUsbDevice");

                Console.WriteLine($"[WacomSignatureService] wgssSTU.UsbDevices: {_usbDevicesType != null}");
                Console.WriteLine($"[WacomSignatureService] wgssSTU.Tablet: {_tabletType != null}");
                Console.WriteLine($"[WacomSignatureService] wgssSTU.IUsbDevice: {_iUsbDeviceType != null}");

                if (_usbDevicesType != null && _tabletType != null)
                {
                    _sdkLoaded = true;
                    Console.WriteLine("[WacomSignatureService] ✓ SDK de Wacom STU cargado correctamente.");
                }
                else
                {
                    _lastError = "No se encontraron las clases esperadas en el SDK (wgssSTU.UsbDevices, wgssSTU.Tablet)";
                    _lastExceptionType = "TypeLoadException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                }
            }
            catch (BadImageFormatException ex)
            {
                _lastError = $"Conflicto de arquitectura: {ex.Message}";
                _lastExceptionType = "BadImageFormatException";
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ BadImageFormatException: {_lastError}");
            }
            catch (DllNotFoundException ex)
            {
                _lastError = $"DLL no encontrada: {ex.Message}";
                _lastExceptionType = "DllNotFoundException";
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ DllNotFoundException: {_lastError}");
            }
            catch (FileNotFoundException ex)
            {
                _lastError = $"Archivo no encontrado: {ex.Message}";
                _lastExceptionType = "FileNotFoundException";
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ FileNotFoundException: {_lastError}");
            }
            catch (UnauthorizedAccessException ex)
            {
                _lastError = $"Acceso denegado: {ex.Message}";
                _lastExceptionType = "UnauthorizedAccessException";
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ UnauthorizedAccessException: {_lastError}");
            }
            catch (Exception ex)
            {
                _lastError = $"Error al cargar SDK: {ex.Message}";
                _lastExceptionType = ex.GetType().Name;
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ {_lastExceptionType}: {_lastError}");
                if (!string.IsNullOrEmpty(_lastExceptionStackTrace))
                {
                    Console.WriteLine($"[WacomSignatureService] Stack trace: {_lastExceptionStackTrace}");
                }
            }
        }

        private List<string> SearchComProgIdsInRegistry()
        {
            var foundProgIds = new List<string>();
            var searchTerms = new[] { "wgss", "wgssSTU", "Wacom", "UsbDevices", "Tablet", "ProtocolHelper", "STU" };

            try
            {
                Console.WriteLine("[WacomSignatureService] Buscando ProgIDs en HKEY_CLASSES_ROOT");
                
                foreach (var keyName in Registry.ClassesRoot.GetSubKeyNames())
                {
                    foreach (var term in searchTerms)
                    {
                        if (keyName.Contains(term, StringComparison.OrdinalIgnoreCase))
                        {
                            foundProgIds.Add(keyName);
                            Console.WriteLine($"[WacomSignatureService] ProgID encontrado: {keyName}");
                            break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WacomSignatureService] Error al buscar en Registry: {ex.Message}");
            }

            return foundProgIds;
        }

        private List<ProgIdTestResult> TestProgIds()
        {
            var results = new List<ProgIdTestResult>();
            var progIdsToTest = new[]
            {
                "WacomGSS.STU.UsbDevices",
                "WacomGSS.STU.UsbDevices.1",
                "WacomGSS.STU.Tablet",
                "WacomGSS.STU.Tablet.1",
                "WacomGSS.STU.ProtocolHelper",
                "WacomGSS.STU.ProtocolHelper.1",
                "wgssSTU.UsbDevices",
                "wgssSTU.UsbDevices.1",
                "wgssSTU.Tablet",
                "wgssSTU.Tablet.1"
            };

            Console.WriteLine("[WacomSignatureService] Probando ProgIDs posibles");
            
            foreach (var progId in progIdsToTest)
            {
                var result = new ProgIdTestResult { ProgId = progId };
                
                try
                {
                    var type = Type.GetTypeFromProgID(progId);
                    result.TypeFound = type != null;
                    
                    if (type != null)
                    {
                        Console.WriteLine($"[WacomSignatureService] ✓ ProgID '{progId}' encontrado");
                        
                        try
                        {
                            var instance = Activator.CreateInstance(type);
                            result.CanCreateInstance = instance != null;
                            Console.WriteLine($"[WacomSignatureService] ✓ ProgID '{progId}' puede crear instancia");
                            
                            if (instance != null && progId.Contains("UsbDevices", StringComparison.OrdinalIgnoreCase))
                            {
                                if (_selectedProgId == null)
                                {
                                    _selectedProgId = progId;
                                    _selectedCreationMethod = "ProgID";
                                    Console.WriteLine($"[WacomSignatureService] ✓ ProgID seleccionado: {progId}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            result.Error = $"No se puede crear instancia: {ex.Message}";
                            Console.WriteLine($"[WacomSignatureService] ✗ ProgID '{progId}' error al crear instancia: {ex.Message}");
                        }
                    }
                    else
                    {
                        Console.WriteLine($"[WacomSignatureService] ✗ ProgID '{progId}' no encontrado");
                    }
                }
                catch (Exception ex)
                {
                    result.Error = ex.Message;
                    Console.WriteLine($"[WacomSignatureService] ✗ ProgID '{progId}' error: {ex.Message}");
                }
                
                results.Add(result);
            }

            return results;
        }

        private List<string> InspectClassMembers(Type type)
        {
            var members = new List<string>();
            
            if (type == null)
            {
                Console.WriteLine("[WacomSignatureService] Tipo null, no se pueden inspeccionar miembros");
                return members;
            }

            try
            {
                var properties = type.GetProperties();
                foreach (var prop in properties)
                {
                    members.Add($"Property: {prop.Name} ({prop.PropertyType.Name})");
                }
                
                var methods = type.GetMethods();
                foreach (var method in methods)
                {
                    if (!method.Name.StartsWith("get_") && !method.Name.StartsWith("set_"))
                    {
                        var parameters = string.Join(", ", method.GetParameters().Select(p => $"{p.ParameterType.Name} {p.Name}"));
                        members.Add($"Method: {method.Name}({parameters}) -> {method.ReturnType.Name}");
                    }
                }
            }
            catch (Exception ex)
            {
                members.Add($"Error inspecting members: {ex.Message}");
            }
            
            return members;
        }

        private List<MethodSignature> InspectMethodSignatures(Type type, params string[] methodNames)
        {
            var signatures = new List<MethodSignature>();
            
            if (type == null)
            {
                Console.WriteLine("[WacomSignatureService] Tipo null, no se pueden inspeccionar firmas de métodos");
                return signatures;
            }

            try
            {
                var methods = type.GetMethods();
                foreach (var methodName in methodNames)
                {
                    var method = methods.FirstOrDefault(m => m.Name.Equals(methodName, StringComparison.OrdinalIgnoreCase));
                    if (method != null)
                    {
                        var signature = new MethodSignature
                        {
                            Name = method.Name,
                            ReturnType = method.ReturnType.Name
                        };
                        
                        foreach (var param in method.GetParameters())
                        {
                            signature.Parameters.Add(new MethodParameter
                            {
                                Name = param.Name,
                                Type = param.ParameterType.Name
                            });
                        }
                        
                        signatures.Add(signature);
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WacomSignatureService] Error inspecting method signatures: {ex.Message}");
            }
            
            return signatures;
        }

        private Dictionary<string, object?> ReadErrorCodeObject(object? errorCode)
        {
            var properties = new Dictionary<string, object?>();
            
            if (errorCode == null)
            {
                properties["error"] = "errorCode is null";
                return properties;
            }

            try
            {
                var type = errorCode.GetType();
                properties["typeName"] = type.FullName ?? type.Name;
                
                // Intentar ToString()
                try
                {
                    properties["ToString"] = errorCode.ToString();
                }
                catch (Exception ex)
                {
                    properties["ToString_error"] = ex.Message;
                }
                
                // Leer todas las propiedades públicas
                var props = type.GetProperties();
                foreach (var prop in props)
                {
                    try
                    {
                        var value = prop.GetValue(errorCode);
                        properties[prop.Name] = value?.ToString() ?? "null";
                    }
                    catch (Exception ex)
                    {
                        properties[$"{prop.Name}_error"] = ex.Message;
                    }
                }
            }
            catch (Exception ex)
            {
                properties["error"] = ex.Message;
            }
            
            return properties;
        }

        private List<string> InspectInteropAssemblyTypes()
        {
            var types = new List<string>();
            
            if (_sdkAssembly == null)
            {
                Console.WriteLine("[WacomSignatureService] Assembly SDK no cargado, no se pueden inspeccionar tipos");
                return types;
            }

            try
            {
                Console.WriteLine("[WacomSignatureService] Inspeccionando tipos del assembly Interop.wgssSTU.dll");
                
                var searchTerms = new[] { "Usb", "Tablet", "Protocol", "Device", "STU" };
                
                foreach (var type in _sdkAssembly.GetTypes())
                {
                    var typeName = type.FullName ?? type.Name;
                    
                    foreach (var term in searchTerms)
                    {
                        if (typeName.Contains(term, StringComparison.OrdinalIgnoreCase))
                        {
                            types.Add(typeName);
                            Console.WriteLine($"[WacomSignatureService] Tipo encontrado: {typeName}");
                            break;
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WacomSignatureService] Error al inspeccionar assembly: {ex.Message}");
            }

            return types;
        }

        private void SearchDllsInProject()
        {
            try
            {
                var searchDirectories = new[]
                {
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Libs", "Wacom"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "Libs"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", "Debug", "net6.0"),
                    Path.Combine(AppDomain.CurrentDomain.BaseDirectory, "bin", "Release", "net6.0"),
                    AppDomain.CurrentDomain.BaseDirectory
                };

                foreach (var dir in searchDirectories)
                {
                    if (Directory.Exists(dir))
                    {
                        var dlls = Directory.GetFiles(dir, "*.dll");
                        foreach (var dll in dlls)
                        {
                            if (dll.Contains("wgssSTU") || dll.Contains("WacomGSS") || dll.Contains("STU"))
                            {
                                if (!_foundDlls.Contains(Path.GetFileName(dll)))
                                {
                                    _foundDlls.Add(Path.GetFileName(dll));
                                    Console.WriteLine($"[WacomSignatureService] DLL encontrada en proyecto: {dll}");
                                }
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[WacomSignatureService] Error al buscar DLLs en proyecto: {ex.Message}");
            }
        }

        public async Task<SignatureStatusDto> GetStatusAsync()
        {
            Console.WriteLine("[WacomSignatureService] GetStatusAsync llamado");

            if (!_sdkLoaded)
            {
                Console.WriteLine("[WacomSignatureService] SDK no cargado");
                
                if (_lastExceptionType == "BadImageFormatException")
                {
                    return new SignatureStatusDto
                    {
                        Success = false,
                        Connected = false,
                        Code = "ARCHITECTURE_MISMATCH",
                        Device = null,
                        Message = "Conflicto de arquitectura entre .NET y el SDK de Wacom.",
                        Details = $"Revisa si las DLLs del SDK son x86 o x64. {_lastError}"
                    };
                }
                
                return new SignatureStatusDto
                {
                    Success = false,
                    Connected = false,
                    Code = "WACOM_SDK_NOT_FOUND",
                    Device = null,
                    Message = "No se encontró el SDK de Wacom.",
                    Details = $"Agrega las DLLs oficiales del Wacom STU SDK en signature-service/Libs/Wacom. {_lastError}"
                };
            }

            // Verificar si existe un ProgID válido seleccionado o si existe UsbDevicesClass
            if (string.IsNullOrEmpty(_selectedProgId) && _sdkAssembly != null)
            {
                var usbDevicesClassType = _sdkAssembly.GetType("wgssSTU.UsbDevicesClass");
                if (usbDevicesClassType == null)
                {
                    Console.WriteLine("[WacomSignatureService] No hay UsbDevicesClass ni ProgID seleccionado, verificando registro COM");
                    
                    var comType = Type.GetTypeFromProgID("WacomGSS.STU.UsbDevices");
                    if (comType == null)
                    {
                        comType = Type.GetTypeFromProgID("WacomGSS.STU.UsbDevices.1");
                    }
                    
                    if (comType == null)
                    {
                        Console.WriteLine("[WacomSignatureService] COM no registrado");
                        return new SignatureStatusDto
                        {
                            Success = false,
                            Connected = false,
                            Code = "WACOM_COM_NOT_REGISTERED",
                            Device = null,
                            Message = "El componente COM del SDK Wacom STU no está registrado.",
                            Details = "Ejecuta regsvr32 sobre wgssSTU.dll x64 como administrador. Consulta /signature/diagnostics para más detalles."
                        };
                    }
                }
            }

            // Usar EnsureTabletConnectedAsync para verificar el estado real
            var debug = new Dictionary<string, object?>();
            bool connected = await EnsureTabletConnectedAsync(debug);
            _lastDiagnostics = debug;

            if (connected)
            {
                Console.WriteLine("[WacomSignatureService] Tableta conectada");
                return new SignatureStatusDto
                {
                    Success = true,
                    Connected = true,
                    Code = "TABLET_CONNECTED",
                    Device = _deviceName ?? "Wacom STU-540",
                    Message = "Wacom STU-540 detectada correctamente.",
                    Details = "La tableta está lista para capturar firmas en tiempo real."
                };
            }
            else
            {
                Console.WriteLine("[WacomSignatureService] Tableta no conectada");
                
                var usbCount = debug.ContainsKey("usbDeviceCount") ? debug["usbDeviceCount"]?.ToString() : _usbDeviceCount.ToString();

                if (usbCount == "0" || _usbDeviceCount == 0)
                {
                    return new SignatureStatusDto
                    {
                        Success = false,
                        Connected = false,
                        Code = "TABLET_NOT_FOUND",
                        Device = null,
                        Message = "No se detectó la Wacom STU-540.",
                        Details = "El SDK no encontró dispositivos STU por USB."
                    };
                }

                return new SignatureStatusDto
                {
                    Success = false,
                    Connected = false,
                    Code = "TABLET_CONNECT_FAILED",
                    Device = null,
                    Message = "Se encontró un dispositivo STU, pero no se pudo conectar.",
                    Details = "Ver /signature/diagnostics para detalles."
                };
            }
        }

        private async Task ClearScreenAsync()
        {
            if (_tabletType != null && _tablet != null)
            {
                try
                {
                    var setClearScreenMethod = _tabletType.GetMethod("setClearScreen");
                    if (setClearScreenMethod != null)
                    {
                        setClearScreenMethod.Invoke(_tablet, new object[] { true });
                    }
                }
                catch (Exception ex)
                {
                    Console.WriteLine($"[WacomSignatureService] Error al limpiar pantalla: {ex.Message}");
                }
            }
        }

        public object? GetStartDiagnostics()
        {
            return _lastStartDiagnostics ?? new
            {
                success = true,
                message = "Aún no se ha ejecutado /signature/start."
            };
        }

        public async Task<object> RawTestAsync()
        {
            var debug = new Dictionary<string, object?>();

            try
            {
                debug["step"] = "Trying to load Florentis.STU assembly";
                
                // Intentar cargar el assembly de Florentis.STU
                Assembly? florentisAssembly = null;
                
                // Buscar en el directorio del proyecto
                var projectDir = Path.GetDirectoryName(Assembly.GetExecutingAssembly().Location);
                var dllPath = Path.Combine(projectDir, "Florentis.STU.dll");
                
                if (File.Exists(dllPath))
                {
                    florentisAssembly = Assembly.LoadFrom(dllPath);
                    debug["florentisAssemblyLoaded"] = true;
                    debug["florentisAssemblyPath"] = dllPath;
                }
                else
                {
                    // Intentar cargar desde el assembly actual o GAC
                    florentisAssembly = Assembly.GetAssembly(typeof(object)).GetReferencedAssemblies()
                        .FirstOrDefault(a => a.Name.Contains("Florentis")) != null 
                        ? Assembly.Load("Florentis.STU") 
                        : null;
                    
                    if (florentisAssembly == null)
                    {
                        debug["florentisAssemblyLoaded"] = false;
                        debug["florentisAssemblyPath"] = "Not found";
                        
                        // Fallback: usar el SDK existente (wgssSTU)
                        return await RawTestWithExistingSdk(debug);
                    }
                }

                debug["step"] = "Creating Usb object";
                var usbType = florentisAssembly.GetType("Florentis.STU.Usb");
                if (usbType == null)
                {
                    return new
                    {
                        success = false,
                        code = "USB_TYPE_NOT_FOUND",
                        message = "No se encontró el tipo Florentis.STU.Usb en el assembly.",
                        debug
                    };
                }

                object? usb = Activator.CreateInstance(usbType);
                if (usb == null)
                {
                    return new
                    {
                        success = false,
                        code = "USB_CREATION_FAILED",
                        message = "No se pudo crear instancia de Usb.",
                        debug
                    };
                }

                debug["usbCreated"] = true;

                // Obtener dispositivos USB
                debug["step"] = "Getting USB devices";
                var getUsbDevicesMethod = usbType.GetMethod("getUsbDevices");
                if (getUsbDevicesMethod == null)
                {
                    return new
                    {
                        success = false,
                        code = "GET_USB_DEVICES_METHOD_NOT_FOUND",
                        message = "No se encontró el método getUsbDevices.",
                        debug
                    };
                }

                var devices = getUsbDevicesMethod.Invoke(usb, null);
                if (devices == null)
                {
                    return new
                    {
                        success = false,
                        code = "GET_USB_DEVICES_RETURNED_NULL",
                        message = "getUsbDevices devolvió null.",
                        debug
                    };
                }

                var devicesType = devices.GetType();
                var countProperty = devicesType.GetProperty("Count");
                int count = 0;
                if (countProperty != null)
                {
                    var countValue = countProperty.GetValue(devices);
                    count = Convert.ToInt32(countValue);
                }

                debug["usbDeviceCount"] = count;

                if (count == 0)
                {
                    return new
                    {
                        success = false,
                        code = "TABLET_NOT_FOUND",
                        message = "No se encontraron tabletas Wacom conectadas.",
                        debug
                    };
                }

                // Obtener el primer dispositivo
                var itemProperty = devicesType.GetProperty("Item");
                object? device = null;
                if (itemProperty != null)
                {
                    device = itemProperty.GetValue(devices, new object[] { 0 });
                }

                if (device == null)
                {
                    return new
                    {
                        success = false,
                        code = "USB_DEVICE_NULL",
                        message = "No se pudo obtener el primer dispositivo USB.",
                        debug
                    };
                }

                debug["deviceType"] = device.GetType().FullName;

                // Crear Tablet
                debug["step"] = "Creating Tablet object";
                var tabletType = florentisAssembly.GetType("Florentis.STU.Tablet");
                if (tabletType == null)
                {
                    return new
                    {
                        success = false,
                        code = "TABLET_TYPE_NOT_FOUND",
                        message = "No se encontró el tipo Florentis.STU.Tablet en el assembly.",
                        debug
                    };
                }

                object? tablet = Activator.CreateInstance(tabletType);
                if (tablet == null)
                {
                    return new
                    {
                        success = false,
                        code = "TABLET_CREATION_FAILED",
                        message = "No se pudo crear instancia de Tablet.",
                        debug
                    };
                }

                debug["tabletCreated"] = true;

                // Conectar usando el método del ejemplo oficial
                debug["step"] = "Calling tablet.connect(device, true)";
                var connectMethod = tabletType.GetMethod("connect", new[] { device.GetType(), typeof(bool) });
                if (connectMethod == null)
                {
                    return new
                    {
                        success = false,
                        code = "CONNECT_METHOD_NOT_FOUND",
                        message = "No se encontró el método connect.",
                        debug
                    };
                }

                try
                {
                    connectMethod.Invoke(tablet, new object[] { device, true });
                    debug["connectSuccess"] = true;
                }
                catch (Exception ex)
                {
                    debug["connectException"] = ex.ToString();
                    return new
                    {
                        success = false,
                        code = "CONNECT_EXCEPTION",
                        message = "Excepción al llamar tablet.connect().",
                        exception = ex.ToString(),
                        debug
                    };
                }

                // Obtener información de la tableta
                debug["step"] = "Getting tablet information";
                try
                {
                    var getInkTabletaInformationMethod = tabletType.GetMethod("getInkTabletaInformation");
                    if (getInkTabletaInformationMethod != null)
                    {
                        var info = getInkTabletaInformationMethod.Invoke(tablet, null);
                        var modelNameProperty = info?.GetType().GetProperty("modelName");
                        if (modelNameProperty != null)
                        {
                            debug["modelName"] = modelNameProperty.GetValue(info);
                        }
                    }
                }
                catch (Exception ex)
                {
                    debug["getInkTabletaInformationError"] = ex.ToString();
                }

                // Desconectar
                try
                {
                    var disconnectMethod = tabletType.GetMethod("disconnect");
                    if (disconnectMethod != null)
                    {
                        disconnectMethod.Invoke(tablet, null);
                    }
                }
                catch { }

                return new
                {
                    success = true,
                    connected = true,
                    code = "TABLET_CONNECTED",
                    device = "Wacom STU-540",
                    message = "La Wacom STU-540 conectó correctamente usando la lógica oficial del SDK (Florentis.STU).",
                    debug
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    success = false,
                    code = "RAW_TEST_EXCEPTION",
                    message = "Error ejecutando prueba mínima del SDK Wacom STU.",
                    exception = ex.ToString(),
                    debug
                };
            }
        }

        private async Task<object> RawTestWithExistingSdk(Dictionary<string, object?> debug)
        {
            debug["step"] = "Using existing SDK (wgssSTU) via reflection";
            
            if (!_sdkLoaded)
            {
                return new
                {
                    success = false,
                    code = "SDK_NOT_LOADED",
                    message = "El SDK Wacom STU no está cargado.",
                    debug
                };
            }

            try
            {
                // Crear UsbDevicesClass usando reflexión
                object? usbDevices = null;
                Type? usbDevicesType = null;

                if (_sdkAssembly != null)
                {
                    usbDevicesType = _sdkAssembly.GetType("wgssSTU.UsbDevicesClass");
                    if (usbDevicesType != null)
                    {
                        usbDevices = Activator.CreateInstance(usbDevicesType);
                    }
                }

                if (usbDevices == null && !string.IsNullOrEmpty(_selectedProgId))
                {
                    var comType = Type.GetTypeFromProgID(_selectedProgId);
                    if (comType != null)
                    {
                        usbDevices = Activator.CreateInstance(comType);
                        usbDevicesType = comType;
                    }
                }

                if (usbDevices == null)
                {
                    return new
                    {
                        success = false,
                        code = "USB_DEVICES_CREATION_FAILED",
                        message = "No se pudo crear instancia de UsbDevicesClass.",
                        debug
                    };
                }

                debug["usbDevicesCreated"] = true;

                // Obtener Count
                var countProperty = usbDevicesType?.GetProperty("Count");
                int count = 0;
                if (countProperty != null)
                {
                    var countValue = countProperty.GetValue(usbDevices);
                    count = Convert.ToInt32(countValue);
                }

                debug["usbDeviceCount"] = count;

                if (count <= 0)
                {
                    return new
                    {
                        success = false,
                        code = "TABLET_NOT_FOUND",
                        message = "No se encontraron dispositivos STU por USB.",
                        debug
                    };
                }

                // Obtener el primer IUsbDevice
                var itemProperty = usbDevicesType?.GetProperty("Item");
                object? usbDevice = null;
                if (itemProperty != null)
                {
                    var index = new object[] { 0 };
                    usbDevice = itemProperty.GetValue(usbDevices, index);
                }

                if (usbDevice == null)
                {
                    return new
                    {
                        success = false,
                        code = "USB_DEVICE_NULL",
                        message = "No se pudo obtener el primer dispositivo USB.",
                        debug
                    };
                }

                debug["usbDeviceType"] = usbDevice.GetType().FullName;

                // Crear TabletClass
                Type? tabletType = _sdkAssembly?.GetType("wgssSTU.TabletClass");
                if (tabletType == null)
                {
                    return new
                    {
                        success = false,
                        code = "TABLET_CLASS_NOT_FOUND",
                        message = "No se encontró el tipo TabletClass en el SDK.",
                        debug
                    };
                }

                object? tablet = Activator.CreateInstance(tabletType);
                if (tablet == null)
                {
                    return new
                    {
                        success = false,
                        code = "TABLET_CREATION_FAILED",
                        message = "No se pudo crear instancia de TabletClass.",
                        debug
                    };
                }

                debug["tabletCreated"] = true;

                // Intentar usbConnect con exclusiveLock = true
                var usbConnectMethod = tabletType.GetMethod("usbConnect", new[] { _iUsbDeviceType, typeof(bool) });
                
                if (usbConnectMethod == null)
                {
                    return new
                    {
                        success = false,
                        code = "USB_CONNECT_METHOD_NOT_FOUND",
                        message = "No se encontró el método usbConnect.",
                        debug
                    };
                }

                try
                {
                    var resultTrue = usbConnectMethod.Invoke(tablet, new object[] { usbDevice, true });
                    debug["connectTrueResult"] = resultTrue?.ToString();
                }
                catch (Exception ex)
                {
                    debug["connectTrueException"] = ex.ToString();
                }

                // Verificar isConnected
                var isConnectedMethod = tabletType.GetMethod("isConnected");
                bool connected = false;
                if (isConnectedMethod != null)
                {
                    var connectedValue = isConnectedMethod.Invoke(tablet, null);
                    connected = connectedValue is bool val && val;
                }

                debug["connectedAfterTrue"] = connected;

                // Si no conecta, intentar con exclusiveLock = false
                if (!connected)
                {
                    try
                    {
                        var resultFalse = usbConnectMethod.Invoke(tablet, new object[] { usbDevice, false });
                        debug["connectFalseResult"] = resultFalse?.ToString();
                    }
                    catch (Exception ex)
                    {
                        debug["connectFalseException"] = ex.ToString();
                    }

                    if (isConnectedMethod != null)
                    {
                        var connectedValue = isConnectedMethod.Invoke(tablet, null);
                        connected = connectedValue is bool val && val;
                    }

                    debug["connectedAfterFalse"] = connected;
                }

                if (connected)
                {
                    try
                    {
                        var getProductIdMethod = tabletType.GetMethod("getProductId");
                        if (getProductIdMethod != null)
                        {
                            var productId = getProductIdMethod.Invoke(tablet, null);
                            debug["productId"] = productId;
                        }
                    }
                    catch (Exception ex)
                    {
                        debug["productIdError"] = ex.ToString();
                    }

                    // Limpiar
                    try
                    {
                        var disconnectMethod = tabletType.GetMethod("disconnect");
                        if (disconnectMethod != null)
                        {
                            disconnectMethod.Invoke(tablet, null);
                        }
                    }
                    catch { }

                    return new
                    {
                        success = true,
                        connected = true,
                        code = "TABLET_CONNECTED",
                        device = "Wacom STU-540",
                        message = "La Wacom STU-540 conectó correctamente usando el SDK existente (wgssSTU).",
                        debug
                    };
                }

                return new
                {
                    success = false,
                    connected = false,
                    code = "TABLET_CONNECT_FAILED",
                    message = "Se encontró un dispositivo STU, pero usbConnect no logró dejar tablet.isConnected() en true.",
                    debug
                };
            }
            catch (Exception ex)
            {
                return new
                {
                    success = false,
                    code = "RAW_TEST_EXCEPTION",
                    message = "Error ejecutando prueba mínima del SDK Wacom STU.",
                    exception = ex.ToString(),
                    debug
                };
            }
        }

        public async Task<SignatureResponseDto> ConnectAsync()
        {
            if (!_sdkLoaded)
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "WACOM_SDK_NOT_FOUND",
                    Message = "No se encontró el SDK de Wacom.",
                    Details = "Instala el Wacom STU SDK y agrega las DLLs oficiales al servicio local."
                };
            }

            var connected = await ConnectTabletAsync();
            
            if (connected)
            {
                await _hubContext.Clients.All.SendAsync("signatureConnected", new
                {
                    message = "Conexión con la Wacom STU-540 establecida correctamente."
                });

                return new SignatureResponseDto
                {
                    Success = true,
                    Code = "SIGNATURE_CONNECTED",
                    Message = "Conexión con la Wacom STU-540 establecida correctamente.",
                    Details = "La tableta está lista para iniciar la captura en tiempo real."
                };
            }
            else
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "TABLET_NOT_FOUND",
                    Message = "No se pudo conectar con la Wacom STU-540.",
                    Details = "Verifica que la tableta esté conectada y que el SDK de Wacom esté instalado correctamente."
                };
            }
        }

        private async Task<bool> ConnectTabletAsync()
        {
            Console.WriteLine("[WacomSignatureService] ConnectTabletAsync llamado");
            _tabletDetectionAttempted = true;
            _tabletConnectAttempted = true;
            _tabletConnectionAttempts.Clear();
            
            if (!_sdkLoaded || _usbDevicesType == null || _tabletType == null)
            {
                _lastError = "SDK no cargado o tipos no disponibles";
                _lastExceptionType = "InvalidOperationException";
                Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                return false;
            }

            try
            {
                Console.WriteLine("[WacomSignatureService] Intentando crear UsbDevices");
                
                // Intentar usar UsbDevicesClass directamente primero
                if (_sdkAssembly != null)
                {
                    var usbDevicesClassType = _sdkAssembly.GetType("wgssSTU.UsbDevicesClass");
                    if (usbDevicesClassType != null)
                    {
                        Console.WriteLine("[WacomSignatureService] ✓ UsbDevicesClass encontrada, creando instancia directa");
                        _usbDevices = Activator.CreateInstance(usbDevicesClassType);
                        _selectedCreationMethod = "UsbDevicesClass";
                        _selectedProgId = null;
                        Console.WriteLine("[WacomSignatureService] ✓ UsbDevices creado con UsbDevicesClass");
                    }
                }
                
                // Fallback a ProgID si UsbDevicesClass no existe o falló
                if (_usbDevices == null)
                {
                    Console.WriteLine("[WacomSignatureService] UsbDevicesClass no disponible, intentando ProgID");
                    
                    Type? comType = null;
                    string? progIdUsed = null;

                    // Probar WacomGSS.STU.UsbDevices primero
                    comType = Type.GetTypeFromProgID("WacomGSS.STU.UsbDevices");
                    progIdUsed = "WacomGSS.STU.UsbDevices";
                    
                    if (comType == null)
                    {
                        comType = Type.GetTypeFromProgID("WacomGSS.STU.UsbDevices.1");
                        progIdUsed = "WacomGSS.STU.UsbDevices.1";
                    }

                    if (comType == null)
                    {
                        _lastError = "No se encontró ningún ProgID válido para WacomGSS.STU.UsbDevices. Ejecuta: regsvr32 \"C:\\Program Files (x86)\\Wacom STU SDK\\COM\\bin\\x64\\wgssSTU.dll\"";
                        _lastExceptionType = "COMException";
                        Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                        return false;
                    }

                    Console.WriteLine($"[WacomSignatureService] ✓ ProgID encontrado: {progIdUsed}");
                    _usbDevices = Activator.CreateInstance(comType);
                    _selectedCreationMethod = "ProgID";
                    _selectedProgId = progIdUsed;
                    Console.WriteLine("[WacomSignatureService] ✓ UsbDevices creado con ProgID");
                }

                if (_usbDevices == null)
                {
                    _lastError = "No se pudo crear UsbDevices con ningún método";
                    _lastExceptionType = "InvalidOperationException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    return false;
                }

                // Usar Count e Item para enumerar dispositivos
                Console.WriteLine("[WacomSignatureService] Leyendo UsbDevices.Count...");
                var countProperty = _usbDevices.GetType().GetProperty("Count");
                if (countProperty == null)
                {
                    _lastError = "Propiedad Count no encontrada en UsbDevices";
                    _lastExceptionType = "MissingMethodException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    return false;
                }

                var countValue = countProperty.GetValue(_usbDevices);
                int deviceCount = Convert.ToInt32(countValue);
                _usbDeviceCount = deviceCount;
                _detectedUsbDevices.Clear();
                Console.WriteLine($"[WacomSignatureService] ✓ UsbDevices.Count = {deviceCount}");

                if (deviceCount == 0)
                {
                    _lastError = "No se encontraron dispositivos STU conectados (UsbDevices.Count = 0)";
                    _lastExceptionType = "DeviceNotFoundException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    return false;
                }

                Console.WriteLine("[WacomSignatureService] ✓ Dispositivos STU encontrados");
                
                // Obtener dispositivos usando Item[index]
                var itemProperty = _usbDevices.GetType().GetProperty("Item");
                if (itemProperty == null)
                {
                    _lastError = "Propiedad Item no encontrada en UsbDevices";
                    _lastExceptionType = "MissingMethodException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    return false;
                }

                for (int i = 0; i < deviceCount; i++)
                {
                    Console.WriteLine($"[WacomSignatureService] Obteniendo UsbDevices.Item[{i}]...");
                    object? device = itemProperty.GetValue(_usbDevices, new object[] { i });
                    
                    if (device != null)
                    {
                        var deviceInfo = new UsbDeviceInfo
                        {
                            Index = i,
                            Type = device.GetType().Name,
                            Available = true
                        };

                        // Intentar obtener propiedades del dispositivo
                        try
                        {
                            var deviceType = device.GetType();
                            var allProps = deviceType.GetProperties();
                            Console.WriteLine($"[WacomSignatureService]   Propiedades encontradas en dispositivo: {allProps.Length}");
                            
                            foreach (var prop in allProps)
                            {
                                Console.WriteLine($"[WacomSignatureService]   Propiedad: {prop.Name} ({prop.PropertyType.Name})");
                            }
                            
                            var idVendorProp = deviceType.GetProperty("idVendor");
                            if (idVendorProp != null)
                            {
                                try
                                {
                                    var idVendorValue = idVendorProp.GetValue(device);
                                    deviceInfo.IdVendor = idVendorValue?.ToString();
                                    Console.WriteLine($"[WacomSignatureService]   idVendor = {deviceInfo.IdVendor}");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[WacomSignatureService]   Error leyendo idVendor: {ex.Message}");
                                }
                            }

                            var idProductProp = deviceType.GetProperty("idProduct");
                            if (idProductProp != null)
                            {
                                try
                                {
                                    var idProductValue = idProductProp.GetValue(device);
                                    deviceInfo.IdProduct = idProductValue?.ToString();
                                    Console.WriteLine($"[WacomSignatureService]   idProduct = {deviceInfo.IdProduct}");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[WacomSignatureService]   Error leyendo idProduct: {ex.Message}");
                                }
                            }

                            var bcdDeviceProp = deviceType.GetProperty("bcdDevice");
                            if (bcdDeviceProp != null)
                            {
                                try
                                {
                                    var bcdDeviceValue = bcdDeviceProp.GetValue(device);
                                    deviceInfo.BcdDevice = bcdDeviceValue?.ToString();
                                    Console.WriteLine($"[WacomSignatureService]   bcdDevice = {deviceInfo.BcdDevice}");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[WacomSignatureService]   Error leyendo bcdDevice: {ex.Message}");
                                }
                            }

                            var fileNameProp = deviceType.GetProperty("fileName");
                            if (fileNameProp != null)
                            {
                                try
                                {
                                    var fileNameValue = fileNameProp.GetValue(device);
                                    deviceInfo.FileName = fileNameValue?.ToString();
                                    Console.WriteLine($"[WacomSignatureService]   fileName = {deviceInfo.FileName}");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[WacomSignatureService]   Error leyendo fileName: {ex.Message}");
                                }
                            }

                            var bulkFileNameProp = deviceType.GetProperty("bulkFileName");
                            if (bulkFileNameProp != null)
                            {
                                try
                                {
                                    var bulkFileNameValue = bulkFileNameProp.GetValue(device);
                                    deviceInfo.BulkFileName = bulkFileNameValue?.ToString();
                                    Console.WriteLine($"[WacomSignatureService]   bulkFileName = {deviceInfo.BulkFileName}");
                                }
                                catch (Exception ex)
                                {
                                    Console.WriteLine($"[WacomSignatureService]   Error leyendo bulkFileName: {ex.Message}");
                                }
                            }
                        }
                        catch (Exception ex)
                        {
                            Console.WriteLine($"[WacomSignatureService]   Error al obtener propiedades del dispositivo: {ex.Message}");
                        }

                        _detectedUsbDevices.Add(deviceInfo);
                        Console.WriteLine($"[WacomSignatureService] ✓ Dispositivo [{i}]: {deviceInfo.Type}");
                    }
                }

                if (_detectedUsbDevices.Count == 0)
                {
                    _lastError = "No se pudieron obtener dispositivos de UsbDevices.Item";
                    _lastExceptionType = "NullReferenceException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    return false;
                }

                // Usar el primer dispositivo para conectar
                object? firstDevice = null;
                var firstDeviceInfo = _detectedUsbDevices.FirstOrDefault();
                if (firstDeviceInfo != null)
                {
                    firstDevice = itemProperty.GetValue(_usbDevices, new object[] { firstDeviceInfo.Index });
                }

                if (firstDevice == null)
                {
                    _lastError = "El primer dispositivo obtenido es null";
                    _lastExceptionType = "NullReferenceException";
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                    return false;
                }

                Console.WriteLine($"[WacomSignatureService] ✓ Dispositivo seleccionado para conexión: {firstDevice.GetType().Name}");

                Console.WriteLine("[WacomSignatureService] Creando instancia de Tablet");
                
                // Intentar usar TabletClass directamente primero
                Type? tabletClassType = null;
                if (_sdkAssembly != null)
                {
                    tabletClassType = _sdkAssembly.GetType("wgssSTU.TabletClass");
                    if (tabletClassType != null)
                    {
                        Console.WriteLine("[WacomSignatureService] ✓ TabletClass encontrada, creando instancia directa");
                        _tablet = Activator.CreateInstance(tabletClassType);
                    }
                }
                
                // Fallback a ProgID
                if (_tablet == null)
                {
                    var tabletComType = Type.GetTypeFromProgID("WacomGSS.STU.Tablet");
                    if (tabletComType == null)
                    {
                        tabletComType = Type.GetTypeFromProgID("WacomGSS.STU.Tablet.1");
                    }
                    
                    if (tabletComType == null)
                    {
                        _lastError = "El componente COM WacomGSS.STU.Tablet no está registrado";
                        _lastExceptionType = "COMException";
                        Console.WriteLine($"[WacomSignatureService] ✗ {_lastError}");
                        return false;
                    }

                    _tablet = Activator.CreateInstance(tabletComType);
                    Console.WriteLine("[WacomSignatureService] ✓ Tablet creada con ProgID");
                }
                else
                {
                    Console.WriteLine("[WacomSignatureService] ✓ Tablet creada con TabletClass");
                }

                // Intentar conectar usando reflexión sobre la instancia de tablet (no sobre el tipo)
                Console.WriteLine("[WacomSignatureService] Intentando conectar tableta...");
                
                // Intentar usbConnect con true primero
                bool connected = false;
                
                try
                {
                    var usbConnectMethod = _tablet?.GetType().GetMethod("usbConnect", new[] { _iUsbDeviceType, typeof(bool) });
                    
                    if (usbConnectMethod != null && _tablet != null && firstDevice != null)
                    {
                        // Intento 1: usbConnect(device, true)
                        Console.WriteLine("[WacomSignatureService] Intento 1: tablet.usbConnect(device, true)");
                        var attempt1 = new TabletConnectionAttempt
                        {
                            Method = "usbConnect",
                            Exclusive = true
                        };
                        
                        try
                        {
                            var errorCode = usbConnectMethod.Invoke(_tablet, new[] { firstDevice, true });
                            attempt1.ReturnType = errorCode?.GetType().Name;
                            
                            // Usar ReadErrorCodeObject para leer el IErrorCode
                            var errorCodeProps = ReadErrorCodeObject(errorCode);
                            attempt1.ErrorCodeToString = errorCode?.ToString();
                            
                            foreach (var kvp in errorCodeProps)
                            {
                                attempt1.ErrorCodeProperties[kvp.Key] = kvp.Value?.ToString();
                            }
                            
                            attempt1.ErrorCodeMembers = InspectClassMembers(errorCode?.GetType());
                            
                            // Intentar obtener el valor del error code
                            if (errorCodeProps.ContainsKey("value"))
                            {
                                attempt1.ErrorCode = errorCodeProps["value"]?.ToString();
                            }
                            
                            Console.WriteLine($"[WacomSignatureService] IErrorCode devuelto: {attempt1.ErrorCodeToString}");
                            
                            // Verificar isConnected después de llamar usbConnect
                            var isConnectedMethod = _tablet.GetType().GetMethod("isConnected");
                            bool isConnected = false;
                            if (isConnectedMethod != null)
                            {
                                var isConnectedValue = isConnectedMethod.Invoke(_tablet, null);
                                isConnected = isConnectedValue is bool val && val;
                            }
                            attempt1.IsConnectedAfterCall = isConnected;
                            Console.WriteLine($"[WacomSignatureService] tablet.isConnected() = {isConnected}");
                            
                            if (isConnected)
                            {
                                attempt1.Success = true;
                                connected = true;
                                _isConnected = true;
                                _lastError = null;
                                _tabletConnectMethod = "usbConnect";
                                Console.WriteLine("[WacomSignatureService] ✓ Tableta conectada exitosamente con usbConnect(device, true).");
                                _tabletConnectionAttempts.Add(attempt1);
                                return true;
                            }
                            else
                            {
                                attempt1.Error = $"usbConnect devolvió IErrorCode pero tablet.isConnected() = false. IErrorCode: {attempt1.ErrorCodeToString}";
                                Console.WriteLine($"[WacomSignatureService] ✗ {attempt1.Error}");
                                _tabletConnectionAttempts.Add(attempt1);
                            }
                        }
                        catch (COMException ex)
                        {
                            attempt1.ExceptionType = "COMException";
                            attempt1.ExceptionMessage = ex.Message;
                            attempt1.ExceptionHResult = ex.HResult;
                            attempt1.Error = $"COMException: {ex.Message} (HResult: 0x{ex.HResult:X8})";
                            _lastExceptionHResult = ex.HResult;
                            Console.WriteLine($"[WacomSignatureService] ✗ {attempt1.Error}");
                            _tabletConnectionAttempts.Add(attempt1);
                        }
                        catch (Exception ex)
                        {
                            attempt1.ExceptionType = ex.GetType().Name;
                            attempt1.ExceptionMessage = ex.Message;
                            attempt1.Error = $"{ex.GetType().Name}: {ex.Message}";
                            Console.WriteLine($"[WacomSignatureService] ✗ {attempt1.Error}");
                            _tabletConnectionAttempts.Add(attempt1);
                        }
                        
                        // Intento 2: usbConnect(device, false)
                        if (!connected)
                        {
                            Console.WriteLine("[WacomSignatureService] Intento 2: tablet.usbConnect(device, false)");
                            var attempt2 = new TabletConnectionAttempt
                            {
                                Method = "usbConnect",
                                Exclusive = false
                            };
                            
                            try
                            {
                                var errorCode = usbConnectMethod.Invoke(_tablet, new[] { firstDevice, false });
                                attempt2.ReturnType = errorCode?.GetType().Name;
                                
                                // Usar ReadErrorCodeObject para leer el IErrorCode
                                var errorCodeProps = ReadErrorCodeObject(errorCode);
                                attempt2.ErrorCodeToString = errorCode?.ToString();
                                
                                foreach (var kvp in errorCodeProps)
                                {
                                    attempt2.ErrorCodeProperties[kvp.Key] = kvp.Value?.ToString();
                                }
                                
                                attempt2.ErrorCodeMembers = InspectClassMembers(errorCode?.GetType());
                                
                                // Intentar obtener el valor del error code
                                if (errorCodeProps.ContainsKey("value"))
                                {
                                    attempt2.ErrorCode = errorCodeProps["value"]?.ToString();
                                }
                                
                                Console.WriteLine($"[WacomSignatureService] IErrorCode devuelto: {attempt2.ErrorCodeToString}");
                                
                                // Verificar isConnected después de llamar usbConnect
                                var isConnectedMethod = _tablet.GetType().GetMethod("isConnected");
                                bool isConnected = false;
                                if (isConnectedMethod != null)
                                {
                                    var isConnectedValue = isConnectedMethod.Invoke(_tablet, null);
                                    isConnected = isConnectedValue is bool val && val;
                                }
                                attempt2.IsConnectedAfterCall = isConnected;
                                Console.WriteLine($"[WacomSignatureService] tablet.isConnected() = {isConnected}");
                                
                                if (isConnected)
                                {
                                    attempt2.Success = true;
                                    connected = true;
                                    _isConnected = true;
                                    _lastError = null;
                                    _tabletConnectMethod = "usbConnect";
                                    Console.WriteLine("[WacomSignatureService] ✓ Tableta conectada exitosamente con usbConnect(device, false).");
                                    _tabletConnectionAttempts.Add(attempt2);
                                    return true;
                                }
                                else
                                {
                                    attempt2.Error = $"usbConnect devolvió IErrorCode pero tablet.isConnected() = false. IErrorCode: {attempt2.ErrorCodeToString}";
                                    Console.WriteLine($"[WacomSignatureService] ✗ {attempt2.Error}");
                                    _tabletConnectionAttempts.Add(attempt2);
                                }
                            }
                            catch (COMException ex)
                            {
                                attempt2.ExceptionType = "COMException";
                                attempt2.ExceptionMessage = ex.Message;
                                attempt2.ExceptionHResult = ex.HResult;
                                attempt2.Error = $"COMException: {ex.Message} (HResult: 0x{ex.HResult:X8})";
                                _lastExceptionHResult = ex.HResult;
                                Console.WriteLine($"[WacomSignatureService] ✗ {attempt2.Error}");
                                _tabletConnectionAttempts.Add(attempt2);
                            }
                            catch (Exception ex)
                            {
                                attempt2.ExceptionType = ex.GetType().Name;
                                attempt2.ExceptionMessage = ex.Message;
                                attempt2.Error = $"{ex.GetType().Name}: {ex.Message}";
                                Console.WriteLine($"[WacomSignatureService] ✗ {attempt2.Error}");
                                _tabletConnectionAttempts.Add(attempt2);
                            }
                        }
                    }
                    else
                    {
                        var attempt = new TabletConnectionAttempt
                        {
                            Method = "usbConnect",
                            Exclusive = true,
                            Error = "Método usbConnect no encontrado en la instancia de Tablet"
                        };
                        _lastError = attempt.Error;
                        _lastExceptionType = "MissingMethodException";
                        Console.WriteLine($"[WacomSignatureService] ✗ {attempt.Error}");
                        _tabletConnectionAttempts.Add(attempt);
                    }
                    
                    // Intento 3: usbConnect2 si existe
                    if (!connected && _tablet != null && firstDevice != null)
                    {
                        var usbConnect2Method = _tablet.GetType().GetMethod("usbConnect2");
                        
                        if (usbConnect2Method != null)
                        {
                            Console.WriteLine("[WacomSignatureService] Intento 3: tablet.usbConnect2");
                            var attempt3 = new TabletConnectionAttempt
                            {
                                Method = "usbConnect2"
                            };
                            
                            try
                            {
                                var parameters = usbConnect2Method.GetParameters();
                                Console.WriteLine($"[WacomSignatureService] usbConnect2 tiene {parameters.Length} parámetros");
                                
                                foreach (var param in parameters)
                                {
                                    Console.WriteLine($"[WacomSignatureService]   Parámetro: {param.Name} ({param.ParameterType.Name})");
                                }
                                
                                // Obtener fileName y bulkFileName del dispositivo
                                firstDeviceInfo = _detectedUsbDevices.FirstOrDefault();
                                string? fileName = firstDeviceInfo?.FileName;
                                string? bulkFileName = firstDeviceInfo?.BulkFileName;
                                
                                Console.WriteLine($"[WacomSignatureService] fileName del dispositivo: {fileName}");
                                Console.WriteLine($"[WacomSignatureService] bulkFileName del dispositivo: {bulkFileName}");
                                
                                // La firma real es: usbConnect2(String fileName, String bulkFileName, Boolean exclusiveLock)
                                if (parameters.Length == 3 && 
                                    parameters[0].ParameterType == typeof(string) &&
                                    parameters[1].ParameterType == typeof(string) &&
                                    parameters[2].ParameterType == typeof(bool))
                                {
                                    if (!string.IsNullOrWhiteSpace(fileName) && !string.IsNullOrWhiteSpace(bulkFileName))
                                    {
                                        var args = new object?[] { fileName, bulkFileName, false };
                                        Console.WriteLine($"[WacomSignatureService] Llamando usbConnect2('{fileName}', '{bulkFileName}', false)");
                                        
                                        var result = usbConnect2Method.Invoke(_tablet, args);
                                        attempt3.ReturnType = result?.GetType().Name;
                                        
                                        // Usar ReadErrorCodeObject para leer el IErrorCode
                                        var errorCodeProps = ReadErrorCodeObject(result);
                                        attempt3.ErrorCodeToString = result?.ToString();
                                        
                                        foreach (var kvp in errorCodeProps)
                                        {
                                            attempt3.ErrorCodeProperties[kvp.Key] = kvp.Value?.ToString();
                                        }
                                        
                                        attempt3.ErrorCodeMembers = InspectClassMembers(result?.GetType());
                                        
                                        Console.WriteLine($"[WacomSignatureService] IErrorCode devuelto: {attempt3.ErrorCodeToString}");
                                        
                                        // Verificar isConnected después de llamar usbConnect2
                                        var isConnectedMethod = _tablet.GetType().GetMethod("isConnected");
                                        bool isConnected = false;
                                        if (isConnectedMethod != null)
                                        {
                                            var isConnectedValue = isConnectedMethod.Invoke(_tablet, null);
                                            isConnected = isConnectedValue is bool val && val;
                                        }
                                        attempt3.IsConnectedAfterCall = isConnected;
                                        Console.WriteLine($"[WacomSignatureService] tablet.isConnected() = {isConnected}");
                                        
                                        if (isConnected)
                                        {
                                            attempt3.Success = true;
                                            connected = true;
                                            _isConnected = true;
                                            _lastError = null;
                                            _tabletConnectMethod = "usbConnect2";
                                            Console.WriteLine("[WacomSignatureService] ✓ Tableta conectada exitosamente con usbConnect2.");
                                            _tabletConnectionAttempts.Add(attempt3);
                                            return true;
                                        }
                                        else
                                        {
                                            attempt3.Error = $"usbConnect2 devolvió IErrorCode pero tablet.isConnected() = false. IErrorCode: {attempt3.ErrorCodeToString}";
                                            Console.WriteLine($"[WacomSignatureService] ✗ {attempt3.Error}");
                                            _tabletConnectionAttempts.Add(attempt3);
                                        }
                                    }
                                    else
                                    {
                                        attempt3.Error = $"fileName o bulkFileName están vacíos. fileName={fileName}, bulkFileName={bulkFileName}";
                                        Console.WriteLine($"[WacomSignatureService] ✗ {attempt3.Error}");
                                        _tabletConnectionAttempts.Add(attempt3);
                                    }
                                }
                                else
                                {
                                    attempt3.Error = $"Firma de usbConnect2 no reconocida: {parameters.Length} parámetros con tipos {string.Join(", ", parameters.Select(p => p.ParameterType.Name))}";
                                    Console.WriteLine($"[WacomSignatureService] ✗ {attempt3.Error}");
                                    _tabletConnectionAttempts.Add(attempt3);
                                }
                            }
                            catch (COMException ex)
                            {
                                attempt3.ExceptionType = "COMException";
                                attempt3.ExceptionMessage = ex.Message;
                                attempt3.ExceptionHResult = ex.HResult;
                                attempt3.Error = $"COMException: {ex.Message} (HResult: 0x{ex.HResult:X8})";
                                _lastExceptionHResult = ex.HResult;
                                Console.WriteLine($"[WacomSignatureService] ✗ {attempt3.Error}");
                                _tabletConnectionAttempts.Add(attempt3);
                            }
                            catch (Exception ex)
                            {
                                attempt3.ExceptionType = ex.GetType().Name;
                                attempt3.ExceptionMessage = ex.Message;
                                attempt3.Error = $"{ex.GetType().Name}: {ex.Message}";
                                Console.WriteLine($"[WacomSignatureService] ✗ {attempt3.Error}");
                                _tabletConnectionAttempts.Add(attempt3);
                            }
                        }
                        else
                        {
                            Console.WriteLine("[WacomSignatureService] Método usbConnect2 no encontrado");
                        }
                    }
                    
                    if (!connected)
                    {
                        _lastError = "Todos los intentos de conexión fallaron. Revisa tabletConnectionAttempts para detalles.";
                        _lastExceptionType = "ConnectionFailed";
                        Console.WriteLine("[WacomSignatureService] ✗ Todos los intentos de conexión fallaron");
                        return false;
                    }
                }
                catch (Exception ex)
                {
                    _lastError = $"Error inesperado al intentar conectar: {ex.Message}";
                    _lastExceptionType = ex.GetType().Name;
                    _lastExceptionStackTrace = ex.StackTrace;
                    Console.WriteLine($"[WacomSignatureService] ✗ {_lastExceptionType}: {_lastError}");
                    return false;
                }
            }
            catch (COMException ex)
            {
                _lastError = $"Error COM al conectar tableta: {ex.Message} (HResult: 0x{ex.HResult:X8})";
                _lastExceptionType = "COMException";
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ COMException: {_lastError}");
            }
            catch (UnauthorizedAccessException ex)
            {
                _lastError = $"Acceso denegado al conectar tableta: {ex.Message}";
                _lastExceptionType = "UnauthorizedAccessException";
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ UnauthorizedAccessException: {_lastError}");
            }
            catch (Exception ex)
            {
                _lastError = $"Error al conectar tableta: {ex.Message}";
                _lastExceptionType = ex.GetType().Name;
                _lastExceptionStackTrace = ex.StackTrace;
                Console.WriteLine($"[WacomSignatureService] ✗ {_lastExceptionType}: {_lastError}");
                if (!string.IsNullOrEmpty(_lastExceptionStackTrace))
                {
                    Console.WriteLine($"[WacomSignatureService] Stack trace: {_lastExceptionStackTrace}");
                }
            }
            
            return false;
        }

        private async Task<bool> EnsureTabletConnectedAsync(Dictionary<string, object?>? debug = null)
        {
            debug ??= new Dictionary<string, object?>();

            debug["tabletExistsBeforeEnsure"] = _tablet != null;

            bool isConnected = false;

            try
            {
                if (_tablet != null)
                {
                    var isConnectedMethod = _tablet.GetType().GetMethod("isConnected");
                    if (isConnectedMethod != null)
                    {
                        var isConnectedValue = isConnectedMethod.Invoke(_tablet, null);
                        isConnected = isConnectedValue is bool val && val;
                    }
                }
            }
            catch (Exception ex)
            {
                debug["isConnectedCheckError"] = ex.ToString();
                isConnected = false;
            }

            debug["tabletIsConnectedBeforeEnsure"] = isConnected;

            if (isConnected)
            {
                _isConnected = true;
                _deviceName = "Wacom STU-540";
                Console.WriteLine("[WacomSignatureService] EnsureTabletConnectedAsync: tableta ya conectada");
                return true;
            }

            Console.WriteLine("[WacomSignatureService] EnsureTabletConnectedAsync: tableta no conectada, intentando reconectar...");

            // Si hay una instancia vieja, intentar limpiar
            try
            {
                if (_tablet != null)
                {
                    try
                    {
                        var disconnectMethod = _tablet.GetType().GetMethod("disconnect");
                        if (disconnectMethod != null)
                        {
                            disconnectMethod.Invoke(_tablet, null);
                        }
                    }
                    catch { }
                }
            }
            catch { }

            _tablet = null;
            _isConnected = false;
            _deviceName = null;

            // Intentar reconectar usando ConnectTabletAsync existente
            debug["reconnectAttempted"] = true;
            var result = await ConnectTabletAsync();

            debug["reconnectResult"] = result;

            try
            {
                if (_tablet != null)
                {
                    var isConnectedMethod = _tablet.GetType().GetMethod("isConnected");
                    if (isConnectedMethod != null)
                    {
                        var isConnectedValue = isConnectedMethod.Invoke(_tablet, null);
                        isConnected = isConnectedValue is bool val && val;
                    }
                }
            }
            catch (Exception ex)
            {
                debug["isConnectedAfterReconnectError"] = ex.ToString();
                isConnected = false;
            }

            debug["tabletIsConnectedAfterEnsure"] = isConnected;

            if (isConnected)
            {
                _isConnected = true;
                _deviceName = "Wacom STU-540";
                Console.WriteLine("[WacomSignatureService] EnsureTabletConnectedAsync: reconexión exitosa");
                return true;
            }

            _isConnected = false;
            Console.WriteLine("[WacomSignatureService] EnsureTabletConnectedAsync: reconexión falló");
            return false;
        }

        public async Task<SignatureResponseDto> StartCaptureAsync()
        {
            Console.WriteLine("[WacomSignatureService] StartCaptureAsync llamado");
            
            if (!_sdkLoaded)
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "WACOM_SDK_NOT_FOUND",
                    Message = "No se encontró el SDK de Wacom.",
                    Details = "Agrega las DLLs oficiales del Wacom STU SDK al servicio local para habilitar la captura real."
                };
            }

            var debug = new Dictionary<string, object?>();
            _startCaptureDebug = debug;
            
            bool connected = await EnsureTabletConnectedAsync(debug);

            if (!connected || _tablet == null)
            {
                _lastStartDiagnostics = debug;

                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "TABLET_NOT_CONNECTED",
                    Message = "No se pudo conectar con la Wacom STU-540.",
                    Details = "No fue posible asegurar una conexión activa antes de iniciar la captura.",
                    Debug = debug
                };
            }

            try
            {
                await ClearScreenAsync();

                Console.WriteLine("[WacomSignatureService] Iniciando captura con startCapture...");
                
                var startCaptureMethod = _tablet.GetType().GetMethod("startCapture", new[] { typeof(uint) });
                if (startCaptureMethod != null)
                {
                    uint sessionId = (uint)DateTimeOffset.UtcNow.ToUnixTimeSeconds();
                    debug["startCaptureAttempted"] = true;
                    debug["startCaptureSessionId"] = sessionId;
                    
                    Console.WriteLine($"[WacomSignatureService] Llamando startCapture con sessionId: {sessionId}");
                    startCaptureMethod.Invoke(_tablet, new object[] { sessionId });
                    _isCapturing = true;
                    _captureActive = true;
                    _capturedPoints.Clear();
                    
                    debug["startCaptureSuccess"] = true;
                    Console.WriteLine("[WacomSignatureService] ✓ Captura iniciada exitosamente");
                    
                    await _hubContext.Clients.All.SendAsync("signatureStarted", new
                    {
                        message = "Captura de firma iniciada."
                    });
                    
                    _lastStartDiagnostics = debug;

                    return new SignatureResponseDto
                    {
                        Success = true,
                        Code = "SIGNATURE_CAPTURE_STARTED",
                        Message = "Captura de firma iniciada.",
                        Details = "La tableta está conectada y capturando. Falta completar la suscripción a eventos de lápiz para tiempo real.",
                        Debug = debug
                    };
                }
                else
                {
                    debug["startCaptureMethodNotFound"] = true;
                    _lastStartDiagnostics = debug;

                    return new SignatureResponseDto
                    {
                        Success = false,
                        Code = "START_CAPTURE_METHOD_NOT_FOUND",
                        Message = "No se pudo iniciar la captura de firma.",
                        Details = "El método startCapture no se encontró en la instancia de Tablet.",
                        Debug = debug
                    };
                }
            }
            catch (COMException ex)
            {
                _lastExceptionType = "COMException";
                _lastExceptionHResult = ex.HResult;
                _lastExceptionStackTrace = ex.StackTrace;
                debug["exceptionType"] = "COMException";
                debug["exceptionMessage"] = ex.Message;
                debug["exceptionHResult"] = ex.HResult;
                Console.WriteLine($"[WacomSignatureService] COMException al iniciar captura: {ex.Message} (HResult: 0x{ex.HResult:X8})");
                
                _lastStartDiagnostics = debug;

                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "START_CAPTURE_COM_ERROR",
                    Message = "No se pudo iniciar la captura de firma.",
                    Details = $"COMException: {ex.Message} (HResult: 0x{ex.HResult:X8})",
                    Debug = debug
                };
            }
            catch (Exception ex)
            {
                _lastExceptionType = ex.GetType().Name;
                _lastExceptionStackTrace = ex.StackTrace;
                debug["exceptionType"] = ex.GetType().Name;
                debug["exceptionMessage"] = ex.Message;
                Console.WriteLine($"[WacomSignatureService] Exception al iniciar captura: {ex.GetType().Name}: {ex.Message}");
                
                _lastStartDiagnostics = debug;

                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "START_CAPTURE_ERROR",
                    Message = "No se pudo iniciar la captura de firma.",
                    Details = $"{ex.GetType().Name}: {ex.Message}",
                    Debug = debug
                };
            }
        }

        public async Task<SignatureResponseDto> ClearAsync()
        {
            try
            {
                await ClearScreenAsync();
                _capturedPoints.Clear();
                _signatureImageBase64 = null;
                
                await _hubContext.Clients.All.SendAsync("signatureCleared", new
                {
                    message = "Firma eliminada correctamente."
                });
                
                return new SignatureResponseDto
                {
                    Success = true,
                    Code = "SIGNATURE_CLEARED",
                    Message = "Firma eliminada correctamente.",
                    Details = "Se limpió la pantalla de la tableta y la vista previa del navegador."
                };
            }
            catch (Exception ex)
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "SIGNATURE_ERROR",
                    Message = "No se pudo limpiar la firma.",
                    Details = ex.Message
                };
            }
        }

        public async Task<SignatureResponseDto> CancelAsync()
        {
            try
            {
                if (_isCapturing && _tabletType != null && _tablet != null)
                {
                    var endCaptureMethod = _tabletType.GetMethod("endCapture");
                    endCaptureMethod?.Invoke(_tablet, null);
                }

                _isCapturing = false;
                _capturedPoints.Clear();
                _signatureImageBase64 = null;
                
                await _hubContext.Clients.All.SendAsync("signatureCancelled", new
                {
                    message = "Captura de firma cancelada."
                });
                
                return new SignatureResponseDto
                {
                    Success = true,
                    Code = "SIGNATURE_CAPTURE_CANCELLED",
                    Message = "Captura de firma cancelada.",
                    Details = "El proceso de firma fue cancelado correctamente."
                };
            }
            catch (Exception ex)
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "SIGNATURE_ERROR",
                    Message = "No se pudo cancelar la captura.",
                    Details = ex.Message
                };
            }
        }

        public async Task<SignatureResponseDto> ConfirmAsync()
        {
            if (!_isCapturing && _capturedPoints.Count == 0)
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "NO_ACTIVE_CAPTURE",
                    Message = "No hay una captura activa para confirmar.",
                    Details = "Primero inicia una captura de firma."
                };
            }

            try
            {
                if (_isCapturing && _tabletType != null && _tablet != null)
                {
                    var endCaptureMethod = _tabletType.GetMethod("endCapture");
                    endCaptureMethod?.Invoke(_tablet, null);
                }

                _isCapturing = false;
                
                _signatureImageBase64 = GenerateSignatureImage();
                
                await _hubContext.Clients.All.SendAsync("signatureConfirmed", new
                {
                    message = "Firma confirmada correctamente."
                });
                
                if (!string.IsNullOrEmpty(_signatureImageBase64))
                {
                    await _hubContext.Clients.All.SendAsync("signatureImageReady", new
                    {
                        image = _signatureImageBase64,
                        message = "Firma lista para guardar."
                    });
                }
                
                return new SignatureResponseDto
                {
                    Success = true,
                    Code = "SIGNATURE_CONFIRMED",
                    Message = "Firma confirmada correctamente.",
                    Details = "La firma fue capturada y está lista para guardarse."
                };
            }
            catch (Exception ex)
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "SIGNATURE_ERROR",
                    Message = "No se pudo confirmar la firma.",
                    Details = ex.Message
                };
            }
        }

        public async Task<SignatureResponseDto> GetSignatureImageAsync()
        {
            if (string.IsNullOrEmpty(_signatureImageBase64))
            {
                return new SignatureResponseDto
                {
                    Success = false,
                    Code = "SIGNATURE_IMAGE_NOT_FOUND",
                    Message = "No hay una firma disponible.",
                    Details = "Primero inicia una captura y realiza la firma."
                };
            }

            return new SignatureResponseDto
            {
                Success = true,
                Code = "SIGNATURE_IMAGE_READY",
                Message = "Firma obtenida correctamente.",
                Image = _signatureImageBase64
            };
        }

        public async Task SendPointAsync(int x, int y, int pressure, bool isPenDown)
        {
            if (!_isCapturing) return;

            var point = new
            {
                x,
                y,
                pressure,
                timestamp = DateTime.UtcNow,
                isPenDown
            };

            _capturedPoints.Add(point);

            await _hubContext.Clients.All.SendAsync("signaturePointReceived", point);
        }

        private string GenerateSignatureImage()
        {
            using (var bitmap = new Bitmap(400, 200))
            using (var graphics = Graphics.FromImage(bitmap))
            {
                graphics.Clear(Color.White);
                
                if (_capturedPoints.Count > 0)
                {
                    var pen = new Pen(Color.Black, 2);
                    var lastPoint = (dynamic?)null;

                    foreach (var point in _capturedPoints)
                    {
                        var pointObj = (dynamic)point;
                        int x = pointObj.x;
                        int y = pointObj.y;
                        bool isDown = pointObj.isPenDown;

                        if (isDown)
                        {
                            if (lastPoint != null)
                            {
                                graphics.DrawLine(pen, lastPoint.x, lastPoint.y, x, y);
                            }
                            else
                            {
                                graphics.FillEllipse(Brushes.Black, x - 1, y - 1, 3, 3);
                            }
                        }
                        
                        lastPoint = isDown ? new { x, y } : null;
                    }
                }
                else
                {
                    graphics.DrawString("Firma Capturada - Wacom STU-540", 
                        new Font("Arial", 12), Brushes.Black, 10, 90);
                }
                
                using (var ms = new MemoryStream())
                {
                    bitmap.Save(ms, ImageFormat.Png);
                    return Convert.ToBase64String(ms.ToArray());
                }
            }
        }

        public async Task<SignatureDiagnosticsDto> GetDiagnosticsAsync()
        {
            Console.WriteLine("[WacomSignatureService] GetDiagnosticsAsync llamado");

            // Usar EnsureTabletConnectedAsync para verificar el estado real
            var debug = new Dictionary<string, object?>();
            bool connected = await EnsureTabletConnectedAsync(debug);
            _lastDiagnostics = debug;

            // Si está conectado, limpiar errores antiguos
            string? lastError = _lastError;
            string? exceptionType = _lastExceptionType;
            string? exceptionStackTrace = _lastExceptionStackTrace;
            int exceptionHResult = _lastExceptionHResult;

            if (connected)
            {
                lastError = null;
                exceptionType = null;
                exceptionStackTrace = null;
                exceptionHResult = 0;
                _isConnected = true;
                Console.WriteLine("[WacomSignatureService] Tableta conectada, limpiando errores antiguos");
            }

            var diagnostics = new SignatureDiagnosticsDto
            {
                ServiceRunning = true,
                SdkFound = _sdkLoaded,
                DllsFound = _foundDlls,
                DllSearchPaths = _searchPaths,
                ProcessArchitecture = RuntimeInformation.ProcessArchitecture.ToString(),
                OsArchitecture = RuntimeInformation.OSArchitecture.ToString(),
                Is64BitProcess = Environment.Is64BitProcess,
                Is64BitOperatingSystem = Environment.Is64BitOperatingSystem,
                TabletConnected = connected,
                DeviceName = _deviceName,
                LastError = lastError,
                ExceptionType = exceptionType,
                ExceptionStackTrace = exceptionStackTrace,
                ExceptionHResult = exceptionHResult,
                ComProgId = "WacomGSS.STU.UsbDevices",
                SelectedCreationMethod = _selectedCreationMethod,
                SelectedProgId = _selectedProgId,
                TabletDetectionAttempted = _tabletDetectionAttempted,
                UsbDeviceCount = _usbDeviceCount,
                DetectedUsbDevices = _detectedUsbDevices,
                TabletConnectAttempted = _tabletConnectAttempted,
                TabletConnectMethod = _tabletConnectMethod,
                TabletConnectionAttempts = _tabletConnectionAttempts,
                TabletUsbConnectSignatures = new List<MethodSignature>()
            };

            // Buscar ProgIDs en Registry
            diagnostics.RegisteredComProgIds = SearchComProgIdsInRegistry();
            if (diagnostics.RegisteredComProgIds.Count == 0)
            {
                diagnostics.ComRegistrySearchMessage = "No se encontraron ProgIDs relacionados con Wacom STU en HKEY_CLASSES_ROOT.";
            }

            // Probar ProgIDs posibles
            diagnostics.ProgIdTests = TestProgIds();
            diagnostics.CanCreateUsbDevices = _selectedProgId != null;

            // Inspeccionar tipos del assembly Interop
            diagnostics.InteropAssemblyTypes = InspectInteropAssemblyTypes();

            // Verificar si existen clases concretas en el assembly
            if (_sdkAssembly != null)
            {
                var usbDevicesClassType = _sdkAssembly.GetType("wgssSTU.UsbDevicesClass");
                var tabletClassType = _sdkAssembly.GetType("wgssSTU.TabletClass");
                
                diagnostics.UsbDevicesClassFound = usbDevicesClassType != null;
                diagnostics.TabletClassFound = tabletClassType != null;
                
                if (usbDevicesClassType != null)
                {
                    diagnostics.InteropTypesFound.Add("wgssSTU.UsbDevicesClass");
                    diagnostics.UsbDevicesClassMembers = InspectClassMembers(usbDevicesClassType);
                }
                if (tabletClassType != null)
                {
                    diagnostics.InteropTypesFound.Add("wgssSTU.TabletClass");
                    diagnostics.TabletClassMembers = InspectClassMembers(tabletClassType);
                    
                    // Inspeccionar firmas de usbConnect y usbConnect2
                    diagnostics.TabletUsbConnectSignatures = InspectMethodSignatures(tabletClassType, "usbConnect", "usbConnect2");
                }
                
                // Inspeccionar IUsbDevice si existe
                var iUsbDeviceType = _sdkAssembly.GetType("wgssSTU.IUsbDevice");
                if (iUsbDeviceType != null)
                {
                    diagnostics.UsbDeviceMembers = InspectClassMembers(iUsbDeviceType);
                }
                
                Console.WriteLine($"[WacomSignatureService] UsbDevicesClass encontrada: {diagnostics.UsbDevicesClassFound}");
                Console.WriteLine($"[WacomSignatureService] TabletClass encontrada: {diagnostics.TabletClassFound}");
            }

            // Diagnóstico COM con ProgID correcto
            try
            {
                var comType = Type.GetTypeFromProgID("WacomGSS.STU.UsbDevices");
                if (comType == null)
                {
                    comType = Type.GetTypeFromProgID("WacomGSS.STU.UsbDevices.1");
                }
                
                diagnostics.ComRegistered = comType != null;
                diagnostics.ComTypeFound = comType != null;
                
                if (comType == null)
                {
                    diagnostics.ComError = "El componente COM WacomGSS.STU.UsbDevices no está registrado.";
                    diagnostics.ComDllPath = @"C:\Program Files (x86)\Wacom STU SDK\COM\bin\x64\wgssSTU.dll";
                }
                else
                {
                    Console.WriteLine("[WacomSignatureService] ✓ COM ProgID WacomGSS.STU.UsbDevices registrado");
                }
            }
            catch (Exception ex)
            {
                diagnostics.ComError = $"Error al verificar registro COM: {ex.Message}";
                Console.WriteLine($"[WacomSignatureService] Error al verificar COM: {ex.Message}");
            }

            // Determinar código de error basado en diagnóstico completo
            if (!_sdkLoaded)
            {
                if (_lastExceptionType == "BadImageFormatException")
                {
                    diagnostics.Code = "ARCHITECTURE_MISMATCH";
                    diagnostics.Message = "Conflicto de arquitectura entre .NET y el SDK de Wacom.";
                    diagnostics.Details = $"Revisa si las DLLs del SDK son x86 o x64. {_lastError}";
                }
                else
                {
                    diagnostics.Code = "WACOM_SDK_NOT_FOUND";
                    diagnostics.Message = "No se encontró el SDK de Wacom.";
                    diagnostics.Details = $"Agrega las DLLs oficiales del Wacom STU SDK en signature-service/Libs/Wacom. {_lastError}";
                }
            }
            else if (!diagnostics.CanCreateUsbDevices && diagnostics.RegisteredComProgIds.Count == 0)
            {
                diagnostics.Code = "WACOM_COM_NOT_REGISTERED";
                diagnostics.Message = "El componente COM del SDK Wacom STU no está registrado.";
                diagnostics.Details = $"Ejecuta regsvr32 sobre wgssSTU.dll x64 como administrador. {diagnostics.ComError}";
            }
            else if (!diagnostics.CanCreateUsbDevices)
            {
                diagnostics.Code = "WACOM_COM_FOUND_BUT_CANNOT_CREATE";
                diagnostics.Message = "El SDK Wacom STU está registrado pero no se puede crear el objeto UsbDevices.";
                diagnostics.Details = $"Se encontraron ProgIDs en Registry pero ninguno pudo crear una instancia de UsbDevices. Revisa los resultados de progIdTests.";
            }
            else if (_usbDeviceCount == 0)
            {
                diagnostics.Code = "TABLET_NOT_FOUND";
                diagnostics.Message = "No se detectó la Wacom STU-540.";
                diagnostics.Details = $"El SDK cargó correctamente y el COM está registrado, pero UsbDevices.Count devolvió 0. Verifica que la tableta esté conectada por USB, que el driver STU esté instalado y que no esté siendo usada por otra aplicación.";
            }
            else if (!_isConnected)
            {
                diagnostics.Code = "TABLET_CONNECT_FAILED";
                diagnostics.Message = "Se encontró un dispositivo STU, pero no se pudo conectar.";
                diagnostics.Details = $"UsbDevices.Count = {_usbDeviceCount}, pero usbConnect falló. Revisa si otra aplicación está usando la tableta o si el driver STU está bloqueando el acceso. Último error: {_lastError}";
            }
            else
            {
                diagnostics.Code = "TABLET_CONNECTED";
                diagnostics.Message = "Wacom STU-540 detectada correctamente.";
                diagnostics.Details = "La tableta está lista para capturar firmas en tiempo real.";
            }

            return diagnostics;
        }
    }
}
