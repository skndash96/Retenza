export async function fetchBusinessCustomers() {
  const res = await fetch(`${window.location.origin}/api/business/customers`);
  if (!res.ok) throw new Error("Failed to fetch customers");
  
  const json = await res.json();
  console.log("API response:", json);
  return json.customers ?? json;
}


