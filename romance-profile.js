const residentProfile = {
  name() {
    try {
      const town = JSON.parse(localStorage.getItem('moadong-v1'));
      return (typeof town?.char?.name === 'string' && town.char.name.trim()) ||
        (localStorage.getItem('geobong-resident-name') || '').trim();
    } catch { return ''; }
  },
  field() {
    return '<label>주인공 이름 <input id="resident-name" autocomplete="nickname" maxlength="24" required></label>';
  },
  register() {
    const input = document.querySelector('#resident-name');
    const name = input.value.trim();
    if (!name) { input.focus(); input.setCustomValidity('이름을 입력해 주세요.'); input.reportValidity(); input.setCustomValidity(''); return ''; }
    localStorage.setItem('geobong-resident-name', name);
    return name;
  },
  call(name) {
    const syllable = name.charCodeAt(name.length - 1) - 0xac00;
    if (syllable < 0 || syllable > 11171) return name;
    return name + (syllable % 28 ? '아' : '야');
  }
};
