# Entity Relationship Diagram (ERD) FalconERP

Diagram ini dibuat berdasarkan skema Prisma di `prisma/schema.prisma`.

## Diagram Inti Bisnis

```mermaid
erDiagram
    User {
        string id PK
        string email UK
        string password
        string name
        string role
        boolean active
        string createdById FK "self-reference"
        string defaultCompanyId FK
        datetime createdAt
        datetime updatedAt
    }

    Company {
        string id PK
        string userId FK
        string name
        string nif
        string primaryColor
        string secondaryColor
        string currency
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Contact {
        string id PK
        string userId FK
        string companyId FK
        string name
        string nif
        string email
        boolean isCustomer
        boolean isSupplier
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Product {
        string id PK
        string userId FK
        string companyId FK
        string code UK
        string name
        string type
        float price
        float tax
        int stock
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Invoice {
        string id PK
        string userId FK
        string companyId FK
        string contactId FK
        string number UK
        enum type
        enum status
        enum paymentStatus
        float subtotal
        float taxAmount
        float total
        datetime date
        datetime dueDate
        datetime createdAt
        datetime updatedAt
    }

    InvoiceItem {
        string id PK
        string invoiceId FK
        string productId FK
        string description
        float quantity
        float price
        float tax
        float subtotal
        float taxAmount
        float total
        datetime createdAt
    }

    Quote {
        string id PK
        string userId FK
        string companyId FK
        string contactId FK
        string number UK
        enum status
        float subtotal
        float taxAmount
        float total
        datetime date
        datetime expiryDate
        datetime createdAt
        datetime updatedAt
    }

    QuoteItem {
        string id PK
        string quoteId FK
        string productId FK
        string description
        float quantity
        float price
        float tax
        float subtotal
        float taxAmount
        float total
        datetime createdAt
    }

    Payment {
        string id PK
        string companyId FK
        string number
        enum type
        enum estado
        decimal amount
        string currency
        string contactId FK
        string projectId FK
        string budgetItemId FK
        string propertyId FK
        datetime date
        datetime createdAt
        datetime updatedAt
    }

    Project {
        string id PK
        string userId FK
        string companyId FK
        string name
        enum status
        datetime startDate
        datetime endDate
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Task {
        string id PK
        string userId FK "creator"
        string assignedToId FK
        string projectId FK
        string title
        boolean completed
        enum priority
        datetime dueDate
        datetime completedAt
        int order
        datetime createdAt
        datetime updatedAt
    }

    Attendance {
        string id PK
        string userId FK
        string companyId FK
        string projectId FK
        string taskId FK
        datetime date
        datetime checkIn
        datetime checkOut
        decimal hourlyRate
        datetime createdAt
        datetime updatedAt
    }

    CrmPipeline {
        string id PK
        string companyId FK
        string name
        boolean isDefault
        int order
        datetime createdAt
        datetime updatedAt
    }

    CrmStage {
        string id PK
        string pipelineId FK
        string name
        string color
        int order
        datetime createdAt
        datetime updatedAt
    }

    CrmOpportunity {
        string id PK
        string companyId FK
        string pipelineId FK
        string stageId FK
        string contactId FK
        string title
        float value
        string currency
        int probability
        enum priority
        enum status
        datetime expectedCloseDate
        datetime closedDate
        datetime createdAt
        datetime updatedAt
    }

    Tracking {
        string id PK
        string userId FK
        string companyId FK
        string contactId FK
        string productId FK
        string invoiceId FK
        string trackingNumber
        enum status
        datetime requestedDate
        datetime deliveredDate
        datetime createdAt
        datetime updatedAt
    }

    WorkOrder {
        string id PK
        string userId FK
        string companyId FK
        string number UK
        datetime date
        datetime scheduledDate
        string responsibleId FK
        boolean approvedByClient
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    WorkOrderItem {
        string id PK
        string workOrderId FK
        string productId FK
        string description
        float quantity
        float durationHours
        enum status
        datetime startedAt
        datetime completedAt
        datetime createdAt
    }

    Property {
        string id PK
        string userId FK
        string companyId FK
        string code UK
        string address
        string block
        string number
        string projectId FK
        string responsableId FK
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Journal {
        string id PK
        string userId FK
        string companyId FK
        string code UK
        string name
        string type
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    Account {
        string id PK
        string userId FK
        string companyId FK
        string code UK
        string name
        string type
        boolean active
        datetime createdAt
        datetime updatedAt
    }

    JournalEntry {
        string id PK
        string userId FK
        string companyId FK
        string number UK
        datetime date
        string reference
        string description
        datetime createdAt
        datetime updatedAt
    }

    JournalEntryLine {
        string id PK
        string journalEntryId FK
        string accountId FK
        string description
        decimal debit
        decimal credit
        datetime createdAt
        datetime updatedAt
    }

    User ||--o{ Company : creates
    User ||--o{ Contact : creates
    User ||--o{ Product : creates
    User ||--o{ Invoice : creates
    User ||--o{ Quote : creates
    User ||--o{ Project : creates
    User ||--o{ Task : creates
    User ||--o{ Attendance : records
    User ||--o{ Tracking : creates
    User ||--o{ WorkOrder : creates
    User ||--o{ Property : creates
    User ||--o{ Journal : creates
    User ||--o{ Account : creates
    User ||--o{ JournalEntry : creates

    Company ||--o{ Contact : has
    Company ||--o{ Product : has
    Company ||--o{ Invoice : has
    Company ||--o{ Quote : has
    Company ||--o{ Project : has
    Company ||--o{ Tracking : has
    Company ||--o{ WorkOrder : has
    Company ||--o{ Property : has
    Company ||--o{ Journal : has
    Company ||--o{ Account : has
    Company ||--o{ CrmPipeline : has
    Company ||--o{ CrmOpportunity : has
    Company ||--o{ Payment : has

    Contact ||--o{ Invoice : receives
    Contact ||--o{ Quote : receives
    Contact ||--o{ CrmOpportunity : linked
    Contact ||--o{ Tracking : associated
    Contact ||--o{ Payment : "makes/receives"
    Contact ||--o{ Property : responsible

    Product ||--o{ InvoiceItem : appears_in
    Product ||--o{ QuoteItem : appears_in
    Product ||--o{ Tracking : tracked
    Product ||--o{ WorkOrderItem : used_in

    Invoice ||--o{ InvoiceItem : contains
    Invoice ||--o{ Tracking : referenced
    Invoice ||--o{ Quote : generates

    Quote ||--o{ QuoteItem : contains
    Quote ||--o{ Invoice : becomes
    Quote ||--o{ WorkOrder : becomes

    Project ||--o{ Task : contains
    Project ||--o{ Attendance : records
    Project ||--o{ InvoiceItem : billed_to
    Project ||--o{ QuoteItem : quoted_for
    Project ||--o{ Payment : receives
    Project ||--o{ Property : associated

    CrmPipeline ||--o{ CrmStage : contains
    CrmStage ||--o{ CrmOpportunity : holds

    WorkOrder ||--o{ WorkOrderItem : contains

    Journal ||--o{ Payment : records
    JournalEntry ||--o{ JournalEntryLine : contains
    Account ||--o{ JournalEntryLine : used_in
```

## Diagram Sistem Komunikasi (Slack Clone)

```mermaid
erDiagram
    Workspace {
        string id PK
        string name
        string slug UK
        string companyId FK
        string createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    WorkspaceMember {
        string id PK
        string workspaceId FK
        string userId FK
        string role
        string status
        datetime joinedAt
    }

    Channel {
        string id PK
        string workspaceId FK
        string name
        string description
        boolean isPrivate
        string createdBy FK
        datetime createdAt
        datetime updatedAt
    }

    ChannelMember {
        string id PK
        string channelId FK
        string userId FK
        string role
        datetime lastReadAt
        datetime joinedAt
    }

    DirectMessage {
        string id PK
        string workspaceId FK
        datetime createdAt
        datetime updatedAt
    }

    DirectMessageParticipant {
        string id PK
        string directMessageId FK
        string userId FK
        datetime lastReadAt
    }

    Message {
        string id PK
        string channelId FK
        string directMessageId FK
        string userId FK
        string content
        string parentId FK
        boolean edited
        datetime editedAt
        datetime createdAt
        datetime updatedAt
    }

    MessageReaction {
        string id PK
        string messageId FK
        string userId FK
        string emoji
        datetime createdAt
    }

    Attachment {
        string id PK
        string messageId FK
        string filename
        string url
        string mimeType
        int size
        datetime createdAt
    }

    MessageMention {
        string id PK
        string messageId FK
        string userId FK
        datetime createdAt
    }

    PinnedMessage {
        string id PK
        string channelId FK
        string messageId FK
        string pinnedBy FK
        datetime pinnedAt
    }

    Workspace ||--o{ WorkspaceMember : has
    Workspace ||--o{ Channel : contains
    Workspace ||--o{ DirectMessage : hosts

    User ||--o{ WorkspaceMember : belongs_to
    User ||--o{ ChannelMember : belongs_to
    User ||--o{ DirectMessageParticipant : participates_in
    User ||--o{ Message : sends
    User ||--o{ MessageReaction : reacts_with
    User ||--o{ MessageMention : mentioned_in
    User ||--o{ PinnedMessage : pins

    Channel ||--o{ ChannelMember : has
    Channel ||--o{ Message : contains
    Channel ||--o{ PinnedMessage : pins

    DirectMessage ||--o{ DirectMessageParticipant : has
    DirectMessage ||--o{ Message : contains

    Message ||--o{ MessageReaction : receives
    Message ||--o{ Attachment : has
    Message ||--o{ MessageMention : includes
    Message ||--o{ PinnedMessage : pinned_as
```

## Catatan

- PK: Primary Key
- UK: Unique Key
- FK: Foreign Key
- Relasi `||--o{` menunjukkan one-to-many (satu ke banyak).
- Relasi `||--||` menunjukkan one-to-one (tidak digunakan banyak di sini).
- Enum dan tipe data lain dihilangkan untuk kesederhanaan.

Diagram ini memberikan gambaran visual tentang hubungan antar tabel dalam database FalconERP. Untuk detail lengkap tipe data dan konstrain, lihat file `prisma/schema.prisma`.
