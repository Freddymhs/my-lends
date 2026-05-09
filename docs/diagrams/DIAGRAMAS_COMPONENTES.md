# Diagramas de Componentes

> Referencia estructural estable. Actualizar solo si cambia la topología del sistema.

## Contexto (alto nivel)

```mermaid
flowchart LR
    User(["👤 Usuario"])
    Browser["Browser / PWA"]
    Firebase_Auth["Firebase Auth\n(Google OAuth)"]
    Firebase_DB["Firebase Realtime DB\n(/lends, /users)"]

    User --> Browser
    Browser --> Firebase_Auth
    Browser --> Firebase_DB
```

## Componentes principales

```mermaid
flowchart TB
    subgraph App ["React App (CRA)"]
        UserContext["UserContext\n(localStorage)"]

        subgraph Pages
            Login["pages/Login.js\nGoogle OAuth popup"]
            Home["pages/Home.js\nOrquestador principal"]
        end

        subgraph Components
            Header["HeaderApp\nLogout + toggle columns"]
            LendsList["LendsList\nCollapse + Swipeable"]
            AddModal["AddLoanModal\nFormulario de creación"]
            Filters["Filters\nEstado del préstamo"]
            DateFilter["DateRangeFilter\nFiltro por fecha"]
        end

        subgraph Helpers
            HelpersJS["helpers.js\nTodas las ops Firebase"]
            HelpersIndex["helpers/index.js\nResolución de nombres"]
        end
    end

    subgraph Firebase
        Auth["Firebase Auth"]
        DB["Realtime DB"]
    end

    Login --> UserContext
    Home --> UserContext
    Home --> LendsList
    Home --> AddModal
    Home --> Filters
    Home --> DateFilter
    Home --> Header
    Home --> HelpersJS
    LendsList --> HelpersIndex
    HelpersJS --> Auth
    HelpersJS --> DB
    Login --> Auth
    Login --> DB
```

## Flujo de multi-tenancy

```mermaid
flowchart LR
    User["Usuario\n(uid, company)"]
    Lend["Préstamo\n(fromCompany, toCompany)"]

    User -- "crea" --> Lend
    Lend -- "fromCompany == company" --> Tab1["Tab: Préstamos"]
    Lend -- "toCompany == company" --> Tab2["Tab: Deudas"]
```
