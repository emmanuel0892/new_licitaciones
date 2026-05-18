using Microsoft.AspNetCore.Mvc;
using signature_service.Services;
using signature_service.Models;

namespace signature_service.Controllers
{
    [ApiController]
    [Route("signature")]
    public class SignatureController : ControllerBase
    {
        private readonly WacomSignatureService _signatureService;

        public SignatureController(WacomSignatureService signatureService)
        {
            _signatureService = signatureService;
        }

        [HttpGet("status")]
        public async Task<IActionResult> GetStatus()
        {
            var status = await _signatureService.GetStatusAsync();
            return Ok(status);
        }

        [HttpGet("diagnostics")]
        public async Task<IActionResult> GetDiagnostics()
        {
            var diagnostics = await _signatureService.GetDiagnosticsAsync();
            return Ok(diagnostics);
        }

        [HttpPost("connect")]
        public async Task<IActionResult> Connect()
        {
            var result = await _signatureService.ConnectAsync();
            return Ok(result);
        }

        [HttpPost("start")]
        public async Task<IActionResult> Start()
        {
            var result = await _signatureService.StartCaptureAsync();
            return Ok(result);
        }

        [HttpPost("clear")]
        public async Task<IActionResult> Clear()
        {
            var result = await _signatureService.ClearAsync();
            return Ok(result);
        }

        [HttpPost("cancel")]
        public async Task<IActionResult> Cancel()
        {
            var result = await _signatureService.CancelAsync();
            return Ok(result);
        }

        [HttpPost("confirm")]
        public async Task<IActionResult> Confirm()
        {
            var result = await _signatureService.ConfirmAsync();
            return Ok(result);
        }

        [HttpGet("image")]
        public async Task<IActionResult> GetImage()
        {
            var result = await _signatureService.GetSignatureImageAsync();
            return Ok(result);
        }

        [HttpGet("start-diagnostics")]
        public IActionResult GetStartDiagnostics()
        {
            var diagnostics = _signatureService.GetStartDiagnostics();
            return Ok(diagnostics);
        }

        [HttpGet("raw-test")]
        public async Task<IActionResult> RawTest()
        {
            var result = await _signatureService.RawTestAsync();
            return Ok(result);
        }

        [HttpPost("disconnect")]
        public IActionResult Disconnect()
        {
            return Ok(new SignatureResponseDto
            {
                Success = true,
                Code = "SIGNATURE_DISCONNECTED",
                Message = "Desconexión completada.",
                Details = "La conexión con la tableta ha sido cerrada."
            });
        }
    }
}
