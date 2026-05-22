"use client"

import { Modal, Button } from "antd"

const ModalInicioAnticipado = ({ open, onConfirm, onContrato, onCancel }) => {
  return (
    <Modal
      title="Seleccionar Flujo"
      open={open}
      onCancel={onCancel}
      footer={[
        <Button key="contrato" onClick={onContrato}>
          No, Contrato
        </Button>,
        <Button key="yes" type="primary" onClick={onConfirm}>
          Si, Inicio Anticipado
        </Button>
      ]}
    >
      <p>Flujo inicio anticipado?</p>
    </Modal>
  )
}

export default ModalInicioAnticipado
