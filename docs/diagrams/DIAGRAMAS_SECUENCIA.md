# Diagramas de Secuencia

> Contratos críticos de interacción. Actualizar solo si cambia el flujo de negocio.

## Login / Registro (Google OAuth)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant L as Login.js
    participant FA as Firebase Auth
    participant DB as Firebase Realtime DB
    participant UC as UserContext

    U->>L: Click "Iniciar sesión con Google"
    L->>FA: signInWithPopup(GoogleAuthProvider)
    FA-->>L: result.user (uid, email, displayName)
    L->>DB: get(/users/{uid})
    alt Usuario existente
        DB-->>L: snapshot con company, numberOfColumns
        L->>UC: setUser({ uid, email, displayName, company, numberOfColumns })
        UC-->>L: navigate("/lends")
    else Usuario nuevo
        DB-->>L: snapshot vacío
        L->>DB: set(/users/{uid}, { company:"null", numberOfColumns:2, ... })
        L->>UC: setUser({ uid, email, displayName, company:"null", numberOfColumns:2 })
        UC-->>L: navigate("/setup") ← FASE 2
    end
```

## Carga de datos en Home

```mermaid
sequenceDiagram
    participant H as Home.js
    participant DB as Firebase Realtime DB
    participant UC as UserContext

    H->>DB: getUsersInFirebase(callback)
    DB-->>H: [lista de usuarios en tiempo real]
    H->>UC: setUser({ ...user, ...datosActualizados })
    H->>DB: getDataFromFirebase(callback, startDate, endDate, filterType)
    DB-->>H: [todos los lends en tiempo real]
    H->>H: filter(fromCompany == company) → returnData
    H->>H: filter(toCompany == company) → belongsData
```

## Creación de préstamo

```mermaid
sequenceDiagram
    actor U as Usuario
    participant M as AddLoanModal
    participant H as helpers.js
    participant DB as Firebase Realtime DB

    U->>M: Click botón +
    U->>M: Completa form (nombre, cantidad, destinatario)
    U->>M: Click "Agregar"
    M->>M: form.validateFields()
    M->>H: addNewItemToDatabase(values)
    H->>H: format date con dayjs
    H->>DB: push(/lends, item)
    DB-->>H: OK
    H-->>M: message.success
    M->>M: setVisible(false), form.resetFields()
```

## Cambio de estado (devolver / borrar)

```mermaid
sequenceDiagram
    actor U as Usuario
    participant Home as Home.js
    participant H as helpers.js
    participant DB as Firebase Realtime DB

    U->>Home: Swipe / confirma modal
    Home->>H: changeStateOfItemInDatabase(item, {uid, displayName, comment}, type)
    H->>H: Construye newParrafo con timestamp
    H->>H: Concatena a item.comment con \n
    alt type === "returned"
        H->>DB: set(/lends/{id}, { returned: !returned, returnedBy: uid, comment })
    else type === "deleted"
        H->>DB: set(/lends/{id}, { deleted: true, deletedBy: uid, comment })
    end
    DB-->>H: OK
    H-->>Home: message.success
```
