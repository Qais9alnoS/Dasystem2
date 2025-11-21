# 💰 FINANCE MODULE - History Integration Guide

## ✅ Already Done

- [x] Import added: `from ..utils.history_helper import log_finance_action`

## 📝 Code Snippets to Add

### 1. Finance Transaction Create (Line ~124)

**After**: `db.refresh(db_transaction)`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="create",
        entity_type="finance_transaction",
        entity_id=db_transaction.id,
        entity_name=f"{transaction.transaction_type} - {transaction.description[:30]}",
        description=f"معاملة مالية {transaction.transaction_type}: {transaction.amount:,.0f} ل.س",
        current_user=current_user,
        academic_year_id=transaction.academic_year_id,
        amount=float(transaction.amount),
        new_values=transaction.dict()
    )
```

### 2. Finance Transaction Update (Line ~185)

**Before**: `db.commit()`
**Add**:

```python
    # Store old values for history
    old_values = {"amount": float(transaction.amount), "description": transaction.description}

   # Log history
    log_finance_action(
        db=db,
        action_type="update",
        entity_type="finance_transaction",
        entity_id=transaction.id,
        entity_name=f"{transaction.transaction_type} - {transaction.description[:30]}",
        description=f"تم تعديل معاملة مالية",
        current_user=current_user,
        amount=float(transaction.amount),
        old_values=old_values,
        new_values=update_data
    )
```

### 3. Finance Transaction Delete (Line ~201)

**Before**: `db.delete(transaction)`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="delete",
        entity_type="finance_transaction",
        entity_id=transaction.id,
        entity_name=f"{transaction.transaction_type} - {transaction.description[:30]}",
        description=f"تم حذف معاملة مالية: {transaction.amount:,.0f} ل.س",
        current_user=current_user,
        amount=float(transaction.amount)
    )
```

### 4. Finance Card Create (Line ~1489 - search for "create_finance_card")

**After**: `db.refresh(db_card)`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="create",
        entity_type="finance_card",
        entity_id=db_card.id,
        entity_name=db_card.card_name,
        description=f"تم إنشاء صندوق جديد: {db_card.card_name}",
        current_user=current_user,
        academic_year_id=db_card.academic_year_id,
        amount=float(db_card.initial_balance) if db_card.initial_balance else 0,
        new_values={"card_name": db_card.card_name, "initial_balance": float(db_card.initial_balance or 0)}
    )
```

### 5. Finance Card Update (search for "update_finance_card")

**Before**: `db.commit()`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="update",
        entity_type="finance_card",
        entity_id=card.id,
        entity_name=card.card_name,
        description=f"تم تعديل بيانات الصندوق: {card.card_name}",
        current_user=current_user,
        new_values=card_data.dict(exclude_unset=True)
    )
```

### 6. Finance Card Delete (search for "delete_finance_card")

**Before**: `db.delete(card)`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="delete",
        entity_type="finance_card",
        entity_id=card.id,
        entity_name=card.card_name,
        description=f"تم حذف الصندوق: {card.card_name}",
        current_user=current_user,
        amount=float(card.balance) if hasattr(card, 'balance') else 0
    )
```

### 7. Finance Card Transaction Create (search for "create_finance_card_transaction")

**After**: `db.refresh(db_transaction)`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="create",
        entity_type="finance_card_transaction",
        entity_id=db_transaction.id,
        entity_name=f"{transaction_type} في {card.card_name}",
        description=f"معاملة في الصندوق ({transaction_type}): {db_transaction.amount:,.0f} ل.س - {db_transaction.description}",
        current_user=current_user,
        amount=float(db_transaction.amount),
        new_values={"type": transaction_type, "amount": float(db_transaction.amount), "category": db_transaction.category}
    )
```

### 8. Student Payment Create (search for "record_student_payment")

**After**: `db.refresh(payment)`
**Add**:

```python
    # Log history
    log_finance_action(
        db=db,
        action_type="create",
        entity_type="student_payment",
        entity_id=payment.id,
        entity_name=f"دفعة {student.full_name}",
        description=f"تم تسجيل دفعة: {payment_data.amount:,.0f} ل.س للطالب {student.full_name}",
        current_user=current_user,
        academic_year_id=student.academic_year_id,
        amount=float(payment_data.amount),
        new_values=payment_data.dict()
    )
```

### 9. Student Finance Update (search for "update_student_finance")

**Before**: `db.commit()`
**Add**:

```python
    # Store old values
    old_values = {"school_fee": float(student_finance.school_fee or 0),
                  "school_discount_value": float(student_finance.school_discount_value or 0)}

    # Log history
    log_finance_action(
        db=db,
        action_type="update",
        entity_type="student_finance",
        entity_id=student_finance.id,
        entity_name=f"بيانات مالية {student.full_name}",
        description=f"تم تعديل البيانات المالية للطالب {student.full_name}",
        current_user=current_user,
        old_values=old_values,
        new_values=finance_data.dict(exclude_unset=True)
    )
```

---

## 🔍 How to Find Locations

Use your editor's search feature to find:

- `def create_finance_card`
- `def update_finance_card`
- `def delete_finance_card`
- `def create_finance_card_transaction`
- `def record_student_payment`
- `def update_student_finance`

Then add the logging code snippets above **exactly where indicated**.

---

## ✅ Expected Result

After integration, all these finance operations will be tracked:

- ✅ All finance transactions (create/update/delete)
- ✅ All finance cards (create/update/delete)
- ✅ All card transactions
- ✅ All student payments
- ✅ All student finance changes

**Critical for audit compliance! 🔒**
