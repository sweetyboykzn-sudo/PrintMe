/** дефолтный макет: 3 строки / картинка / 2 колонки */
export function createDefaultLayout() {
  return {
    title: {
      role: 'title',
      text: 'СТРОКА ОДИН\nСТРОКА ДВА\nСТРОКА ТРИ',
      maxLines: 3,
      fontFamily: 'Impact',
      fontSize: 0.085,
      fill: '#111111',
      fontWeight: 'bold',
      fontStyle: 'normal',
      textAlign: 'center',
      left: 0.5,
      top: 0.06,
      width: 0.92
    },
    image: {
      role: 'image',
      left: 0.5,
      top: 0.40,
      width: 0.92,
      height: 0.38,
      placeholderColor: '#d1d5db'
    },
    leftText: {
      role: 'leftText',
      text: 'Текст\nслева',
      fontFamily: 'Arial',
      fontSize: 0.045,
      fill: '#111111',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      left: 0.27,
      top: 0.84,
      width: 0.42
    },
    rightText: {
      role: 'rightText',
      text: 'Текст\nсправа',
      fontFamily: 'Arial',
      fontSize: 0.045,
      fill: '#111111',
      fontWeight: 'normal',
      fontStyle: 'normal',
      textAlign: 'center',
      left: 0.73,
      top: 0.84,
      width: 0.42
    }
  };
}

export function clampLines(text, maxLines = 3) {
  return String(text || '')
    .split('\n')
    .slice(0, maxLines)
    .join('\n');
}