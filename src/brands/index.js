// brands/index.js
import universal from "./universal";
import cerathrive from "./cerathrive";

const brands = {
  universal,
  cerathrive
};

export function getBrandConfig(brand = "universal") {
  return brands[brand] || universal;
}