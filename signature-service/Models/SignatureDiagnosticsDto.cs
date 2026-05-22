namespace signature_service.Models
{
    public class SignatureDiagnosticsDto
    {
        public bool ServiceRunning { get; set; }
        public bool SdkFound { get; set; }
        public List<string> DllsFound { get; set; } = new List<string>();
        public List<string> DllSearchPaths { get; set; } = new List<string>();
        public string ProcessArchitecture { get; set; } = "";
        public string OsArchitecture { get; set; } = "";
        public bool Is64BitProcess { get; set; }
        public bool Is64BitOperatingSystem { get; set; }
        public bool TabletConnected { get; set; }
        public string? DeviceName { get; set; }
        public string? LastError { get; set; }
        public string? ExceptionType { get; set; }
        public string? ExceptionStackTrace { get; set; }
        public int ExceptionHResult { get; set; }
        public string Code { get; set; } = "";
        public string Message { get; set; } = "";
        public string? Details { get; set; }
        
        // COM Diagnostics
        public string ComProgId { get; set; } = "WacomGSS.STU.UsbDevices";
        public bool ComRegistered { get; set; }
        public bool ComTypeFound { get; set; }
        public string? ComDllPath { get; set; }
        public string? ComError { get; set; }
        public bool UsbDevicesClassFound { get; set; }
        public bool TabletClassFound { get; set; }
        
        // Extended COM Diagnostics
        public List<string> RegisteredComProgIds { get; set; } = new List<string>();
        public List<ProgIdTestResult> ProgIdTests { get; set; } = new List<ProgIdTestResult>();
        public List<string> InteropTypesFound { get; set; } = new List<string>();
        public List<string> InteropAssemblyTypes { get; set; } = new List<string>();
        public string? SelectedCreationMethod { get; set; }
        public string? SelectedProgId { get; set; }
        public bool CanCreateUsbDevices { get; set; }
        public bool TabletDetectionAttempted { get; set; }
        public string? ComRegistrySearchMessage { get; set; }
        
        // Device Enumeration
        public int UsbDeviceCount { get; set; }
        public List<UsbDeviceInfo> DetectedUsbDevices { get; set; } = new List<UsbDeviceInfo>();
        public List<string> UsbDevicesClassMembers { get; set; } = new List<string>();
        public List<string> TabletClassMembers { get; set; } = new List<string>();
        public List<string> UsbDeviceMembers { get; set; } = new List<string>();
        
        // Tablet Connection
        public bool TabletConnectAttempted { get; set; }
        public string? TabletConnectMethod { get; set; }
        public List<TabletConnectionAttempt> TabletConnectionAttempts { get; set; } = new List<TabletConnectionAttempt>();
        public List<MethodSignature> TabletUsbConnectSignatures { get; set; } = new List<MethodSignature>();
    }

    public class ProgIdTestResult
    {
        public string ProgId { get; set; } = "";
        public bool TypeFound { get; set; }
        public bool CanCreateInstance { get; set; }
        public string? Error { get; set; }
    }

    public class UsbDeviceInfo
    {
        public int Index { get; set; }
        public string? Type { get; set; }
        public bool Available { get; set; }
        public string? IdVendor { get; set; }
        public string? IdProduct { get; set; }
        public string? BcdDevice { get; set; }
        public string? FileName { get; set; }
        public string? BulkFileName { get; set; }
    }

    public class TabletConnectionAttempt
    {
        public string Method { get; set; } = "";
        public bool Exclusive { get; set; }
        public bool Success { get; set; }
        public bool IsConnectedAfterCall { get; set; }
        public string? ReturnType { get; set; }
        public string? ReturnValue { get; set; }
        public string? ErrorCode { get; set; }
        public string? ErrorCodeType { get; set; }
        public List<string> ErrorCodeMembers { get; set; } = new List<string>();
        public Dictionary<string, string?> ErrorCodeProperties { get; set; } = new Dictionary<string, string?>();
        public string? ErrorCodeToString { get; set; }
        public string? ExceptionType { get; set; }
        public string? ExceptionMessage { get; set; }
        public int ExceptionHResult { get; set; }
        public string? Error { get; set; }
    }

    public class MethodSignature
    {
        public string Name { get; set; } = "";
        public string? ReturnType { get; set; }
        public List<MethodParameter> Parameters { get; set; } = new List<MethodParameter>();
    }

    public class MethodParameter
    {
        public string? Name { get; set; }
        public string? Type { get; set; }
    }
}
