using SignatureService.Models;

namespace SignatureService.Providers
{
    public interface IWacomSignatureProvider
    {
        SignatureStatusResponse GetStatus();
        SignatureActionResponse StartSignature();
        SignatureActionResponse ClearSignature();
        SignatureSaveResponse SaveSignature();
        SignatureActionResponse StopSignature();
    }
}
