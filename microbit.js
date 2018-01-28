// 接続するBluetoothデバイス
let targetDevice = null;

// micro:bit 加速度サービス
const ACCELEROMETER_SERVICE = "e95d0753-251d-470a-a062-fa1922dfa9a8";

// micro:bit 加速度データキャラクタリスティック
const ACCELEROMETER_DATA = "e95dca4b-251d-470a-a062-fa1922dfa9a8";

// micro:bit 加速度取得間隔キャラクタリスティック
const ACCELEROMETER_PERIOD = "e95dfb24-251d-470a-a062-fa1922dfa9a8";

function onClickStartButton() {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported.")
    return;
  }

  requestDevice();
}

function onClickStopButton() {
  if (!navigator.bluetooth) {
    alert("Web Bluetooth is not supported.")
    return;
  }

  disconnect();
}

function requestDevice() {
  navigator.bluetooth.requestDevice({
    namePrefix: "BBC micro:bit",
    acceptAllDevices: true,
    optionalServices: [ACCELEROMETER_SERVICE]
  })
    .then(device => {
      targetDevice = device;
      connect(targetDevice);
    })
    .catch(error => {
      alert(error);
      targetDevice = null;
    });
}

function disconnect() {
  if (targetDevice == null) {
    alert('target device is null.');
    return;
  }

  targetDevice.gatt.disconnect();
}

// 加速度を表示する
function updateAccelerometerValue(x, y, z) {
  document.getElementsByName("ValueX")[0].innerHTML = "x : " + x;
  document.getElementsByName("ValueY")[0].innerHTML = "y : " + y;
  document.getElementsByName("ValueZ")[0].innerHTML = "z : " + z;
}

// 加速度に応じて背景色を変える
function updateBackgroundColor(x, y, z) {
  let r = Math.min(Math.abs(Math.round(256.0 * x)), 255);
  let g = Math.min(Math.abs(Math.round(256.0 * y)), 255);
  let b = Math.min(Math.abs(Math.round(256.0 * z)), 255);

  let strR = r.toString(16);
  let strG = g.toString(16);
  let strB = b.toString(16);

  if (strR.length == 1) {
    strR = "0" + strR;
  }

  if (strG.length == 1) {
    strG = "0" + strG;
  }

  if (strB.length == 1) {
    strB = "0" + strB;
  }

  document.getElementsByClassName("background")[0].style.backgroundColor = "#" + strR + strG + strB;
  document.getElementsByName("ValueRGB")[0].innerHTML = "#" + strR + strG + strB;
}

function connect(device) {
  device.gatt.connect()
    .then(server => {
      findAccelerometerService(server);
    })
    .catch(error => {
      alert(error);
    });
}

function findAccelerometerService(server) {
  server.getPrimaryService(ACCELEROMETER_SERVICE)
    .then(service => {
      findAccelerometerDataCharacteristic(service);
      findAccelerometerPeriodCharacteristic(service);
    })
    .catch(error => {
      alert(error);
    });
}

function findAccelerometerDataCharacteristic(service) {
  service.getCharacteristic(ACCELEROMETER_DATA)
    .then(characteristic => {
      // ある位置時点のデータだけ取得するだけなら、readValue()すればいいが、
      // Listener登録すれば、データが更新されたタイミングで通知される
      // readAccelerometerDataValue(characteristic);
      startAccelerometerDataNotification(characteristic);
    })
    .catch(error => {
      alert(error);
    });
}

// function readAccelerometerDataValue(characteristic) {
//   characteristic.readValue()
//     .then(dataView => {
//       let x = event.target.value.getInt16(0, true) / 1000;
//       let y = event.target.value.getInt16(2, true) / 1000;
//       let z = event.target.value.getInt16(4, true) / 1000;
//       updateAccelerometerValue(x, y, z)
//       updateBackgroundColor(x, y, z);
//     })
//     .catch(error => {
//       alert(error);
//     });
// }

function startAccelerometerDataNotification(characteristic) {
  characteristic.startNotifications()
    .then(char => {
      characteristic.addEventListener('characteristicvaluechanged',
        onAccelerometerDataChanged);
    });
}

function onAccelerometerDataChanged(event) {
  let x = event.target.value.getInt16(0, true) / 1000;
  let y = event.target.value.getInt16(2, true) / 1000;
  let z = event.target.value.getInt16(4, true) / 1000;
  updateAccelerometerValue(x, y, z)
  updateBackgroundColor(x, y, z);
}

function findAccelerometerPeriodCharacteristic(service) {
  service.getCharacteristic(ACCELEROMETER_PERIOD)
    .then(characteristic => {
      writeAccelerometerPeriodValue(characteristic);
    })
    .catch(error => {
      alert(error);
    });
}

function writeAccelerometerPeriodValue(characteristic) {
  characteristic.writeValue(new Uint16Array([10]))
    .catch(error => {
      alert(error);
    });
}