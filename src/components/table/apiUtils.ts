export const fetchSatellites = async () => {
  const baseUrl = 'https://backend.digantara.dev/v1/satellites';
  const params = new URLSearchParams({
    objectTypes: 'ROCKET BODY,DEBRIS,UNKNOWN,PAYLOAD',
    attributes: [
      'noradCatId',
      'intlDes',
      'name',
      'launchDate',
      'decayDate',
      'objectType',
      'launchSiteCode',
      'countryCode',
      'orbitCode',
    ].join(','),
  });

  const response = await fetch(`${baseUrl}?${params.toString()}`);
  if (!response.ok) throw new Error('Failed to fetch satellites');
  const data = await response.json();
  return data.data;
};