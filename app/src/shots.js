// Fixed scenes for screenshots: ?shot=editor shows the editor with a sample photo
// loaded; ?shot=cover shows the poster alone at the requested export size.
// `photo` picks the sample (boulevard or pier), `caption` the title, `sub` the
// subtitle, `template` the panel layout and `grade` the colour grade.
// window.__shotReady is set once the scene has painted.
export function applyShot(shot, query, api) {
  const title = query.get('caption') ?? 'VICE CITY';
  const subtitle = query.get('sub') ?? 'SUNSET HEIST';
  const template = query.get('template') ?? 'trio';
  const grade = query.get('grade') ?? 'sunset';
  const sizeKey = query.get('size') ?? '1080x1080';
  const photoName = query.get('photo') ?? 'boulevard';
  if (shot === 'cover') document.body.classList.add('shot-cover');
  api.loadSamples().then(() => {
    const photoIndex = photoName === 'pier' ? 1 : 0;
    const panels = [
      { photo: photoIndex, zoom: 1, x: 0, y: 0 },
      { photo: 1 - photoIndex, zoom: 1.15, x: 0.05, y: 0 },
      { photo: photoIndex, zoom: 1.1, x: -0.04, y: 0.03 },
      { photo: 1 - photoIndex, zoom: 1, x: 0, y: -0.02 },
    ];
    api.setState({
      template, grade, lettering: query.get('letter') ?? 'block',
      title, subtitle, sizeKey, selectedPhoto: photoIndex, panels,
    });
  });
}
