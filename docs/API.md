# GoCar Auto - API Reference

A token-optimized reference table for all core endpoints.

## 🔐 Authentication (`/api/auth`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/staff/login` | Staff authentication |
| POST | `/customer/login` | Customer authentication |
| POST | `/customer/register` | Customer onboarding |
| GET | `/verify` | Validates JWT token |

## 👥 Clients (`/api/clients`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | List all client records |
| POST | `/` | Create new client |
| GET | `/:id` | Get client details + vehicles |
| PUT | `/:id` | Update client record |
| GET | `/:id/stats` | Aggregated client analytics |

## 🚗 Vehicles (`/api/vehicles`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | List all vehicles |
| POST | `/` | Register new vehicle |
| GET | `/:id/history` | Full service history |

## 🛠️ Service Management (`/api/service-requests`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/` | List all active requests |
| POST | `/` | Create new service request |
| PATCH | `/:id/status` | Update workflow stage |

## 💳 Financials (`/api/financial`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| POST | `/generate-invoice` | Create PDF invoice |
| GET | `/:id/pdf` | Download invoice |

## 📊 Reports (`/api/reports`)
| Method | Endpoint | Description |
| :--- | :--- | :--- |
| GET | `/revenue` | Financial performance |
| GET | `/dashboard` | System-wide summary |
