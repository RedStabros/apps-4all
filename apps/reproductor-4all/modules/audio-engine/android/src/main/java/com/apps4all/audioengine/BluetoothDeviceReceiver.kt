package com.apps4all.audioengine

import android.bluetooth.BluetoothDevice
import android.content.BroadcastReceiver
import android.content.Context
import android.content.Intent
import android.util.Log

/**
 * Receptor de eventos Bluetooth 100% Offline.
 * Detecta la conexión de auriculares o altavoces Bluetooth para activar perfiles
 * de ecualización personalizados sin rastreo de ubicación (neverForLocation).
 */
class BluetoothDeviceReceiver(private val listener: (deviceName: String, deviceAddress: String) -> Unit) : BroadcastReceiver() {

    companion object {
        private const val TAG = "4AllBluetoothReceiver"
    }

    override fun onReceive(context: Context?, intent: Intent?) {
        val action = intent?.action ?: return

        if (action == BluetoothDevice.ACTION_ACL_CONNECTED) {
            val device: BluetoothDevice? = if (android.os.Build.VERSION.SDK_INT >= android.os.Build.VERSION_CODES.TIRAMISU) {
                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE, BluetoothDevice::class.java)
            } else {
                @Suppress("DEPRECATION")
                intent.getParcelableExtra(BluetoothDevice.EXTRA_DEVICE)
            }

            if (device != null) {
                try {
                    val name = device.name ?: "Dispositivo Bluetooth"
                    // En Android 10+ la dirección MAC puede ser aleatorizada por privacidad
                    val address = device.address ?: "00:00:00:00:00:00"
                    Log.i(TAG, "Auriculares/Altavoz conectado: $name ($address)")
                    listener(name, address)
                } catch (e: SecurityException) {
                    Log.w(TAG, "Permiso BLUETOOTH_CONNECT no concedido aún", e)
                }
            }
        }
    }
}
