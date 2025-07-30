export function randomEmail() {
  return `testuser${Math.floor(Math.random() * 100000)}@example.com`
}
export function randomNickname() {
  return `testnick${Math.floor(Math.random() * 100000)}`
}
export function randomName() {
  const names = ["Alex", "Sam", "Max", "Jamie", "Taylor", "Jordan", "Casey", "Morgan"]
  return names[Math.floor(Math.random() * names.length)]
}
export function randomCountry() {
  // Demo countries
  const countries = ["US", "GB", "DE", "IN", "AU", "CA"]
  return countries[Math.floor(Math.random() * countries.length)]
}
