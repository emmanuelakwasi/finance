import torch
import torch.nn as nn
import torch.optim as optim
from torch.utils.data import DataLoader, TensorDataset
import pandas as pd
import numpy as np
from sklearn.model_selection import train_test_split
from sklearn.preprocessing import StandardScaler
from sklearn.metrics import classification_report, confusion_matrix

# ==========================================
# PHASE 4 -- STEP 2: TRAIN THE NEURAL NETWORK
# ==========================================

print("==========================================")
print(" Phase 4: Deep Learning Collision Detector")
print("==========================================")

# ==========================================
# 1. LOAD AND PREPARE DATA
# ==========================================
print("\n[1] Loading data...")
df = pd.read_csv("collision_data.csv")
print(f"    Loaded {len(df)} samples")
print(f"    Collision cases : {df['label'].sum()} ({round(df['label'].mean()*100,1)}%)")
print(f"    No collision    : {(df['label']==0).sum()} ({round((df['label']==0).mean()*100,1)}%)")

# Split features and labels
X = df.drop(columns="label").values.astype(np.float32)
y = df["label"].values.astype(np.float32)

# Train / Validation / Test split -- 70 / 15 / 15
X_train, X_temp, y_train, y_temp = train_test_split(X, y, test_size=0.30, random_state=42, stratify=y)
X_val,   X_test, y_val,   y_test = train_test_split(X_temp, y_temp, test_size=0.50, random_state=42, stratify=y_temp)

print(f"\n    Train size      : {len(X_train)}")
print(f"    Validation size : {len(X_val)}")
print(f"    Test size       : {len(X_test)}")

# Normalise features -- zero mean, unit variance
scaler = StandardScaler()
X_train = scaler.fit_transform(X_train)
X_val   = scaler.transform(X_val)
X_test  = scaler.transform(X_test)

# Convert to PyTorch tensors
X_train_t = torch.tensor(X_train, dtype=torch.float32)
y_train_t = torch.tensor(y_train, dtype=torch.float32).unsqueeze(1)
X_val_t   = torch.tensor(X_val,   dtype=torch.float32)
y_val_t   = torch.tensor(y_val,   dtype=torch.float32).unsqueeze(1)
X_test_t  = torch.tensor(X_test,  dtype=torch.float32)
y_test_t  = torch.tensor(y_test,  dtype=torch.float32).unsqueeze(1)

# DataLoader for batching
train_dataset = TensorDataset(X_train_t, y_train_t)
train_loader  = DataLoader(train_dataset, batch_size=64, shuffle=True)

# ==========================================
# 2. DEFINE THE NEURAL NETWORK
# ==========================================
class CollisionClassifier(nn.Module):
    def __init__(self, input_dim=8):
        super().__init__()
        self.network = nn.Sequential(
            nn.Linear(input_dim, 128),  # Input layer  -> 128 neurons
            nn.ReLU(),
            nn.Dropout(0.3),            # Dropout to prevent overfitting
            nn.Linear(128, 64),         # 128 -> 64 neurons
            nn.ReLU(),
            nn.Dropout(0.2),
            nn.Linear(64, 32),          # 64 -> 32 neurons
            nn.ReLU(),
            nn.Linear(32, 1),           # 32 -> 1 output neuron
            nn.Sigmoid()                # Output: probability between 0 and 1
        )

    def forward(self, x):
        return self.network(x)

model     = CollisionClassifier(input_dim=8)
criterion = nn.BCELoss()                          # Binary Cross Entropy Loss
optimizer = optim.Adam(model.parameters(), lr=0.001)

print("\n[2] Model architecture:")
print(f"    Input features  : 8")
print(f"    Hidden layers   : 128 -> 64 -> 32 neurons")
print(f"    Output          : 1 neuron (collision probability)")
print(f"    Activation      : ReLU (hidden), Sigmoid (output)")
print(f"    Loss function   : Binary Cross Entropy")
print(f"    Optimiser       : Adam (lr=0.001)")
total_params = sum(p.numel() for p in model.parameters())
print(f"    Total parameters: {total_params}")

# ==========================================
# 3. TRAINING LOOP
# ==========================================
print("\n[3] Training...")
print(f"    {'Epoch':<8} {'Train Loss':<14} {'Val Loss':<14} {'Val Acc':<10}")
print(f"    {'-'*46}")

EPOCHS = 50
best_val_acc = 0.0

for epoch in range(1, EPOCHS + 1):
    # -- Training phase --
    model.train()
    train_loss = 0.0
    for X_batch, y_batch in train_loader:
        optimizer.zero_grad()
        preds = model(X_batch)
        loss  = criterion(preds, y_batch)
        loss.backward()
        optimizer.step()
        train_loss += loss.item()
    train_loss /= len(train_loader)

    # -- Validation phase --
    model.eval()
    with torch.no_grad():
        val_preds = model(X_val_t)
        val_loss  = criterion(val_preds, y_val_t).item()
        val_acc   = ((val_preds >= 0.5).float() == y_val_t).float().mean().item()

    if val_acc > best_val_acc:
        best_val_acc = val_acc
        torch.save(model.state_dict(), "best_model.pth")

    if epoch % 5 == 0 or epoch == 1:
        print(f"    {epoch:<8} {round(train_loss,4):<14} {round(val_loss,4):<14} {round(val_acc*100,2)}%")

print(f"\n    Best validation accuracy: {round(best_val_acc*100, 2)}%")
print(f"    Model saved to: best_model.pth")

# ==========================================
# 4. FINAL EVALUATION ON TEST SET
# ==========================================
print("\n[4] Evaluating on test set...")
model.load_state_dict(torch.load("best_model.pth"))
model.eval()

with torch.no_grad():
    test_probs = model(X_test_t).numpy()
    test_preds = (test_probs >= 0.5).astype(int).flatten()
    test_true  = y_test_t.numpy().flatten().astype(int)

print("\n    Classification Report:")
print(classification_report(test_true, test_preds,
      target_names=["No Collision", "Collision"]))

cm = confusion_matrix(test_true, test_preds)
print("    Confusion Matrix:")
print(f"    {'':20} Predicted No   Predicted Yes")
print(f"    {'Actual No':20} {cm[0][0]:<15} {cm[0][1]}")
print(f"    {'Actual Yes':20} {cm[1][0]:<15} {cm[1][1]}")

tn, fp, fn, tp = cm.ravel()
print(f"\n    True Positives  (correct collision alerts)  : {tp}")
print(f"    True Negatives  (correct safe predictions)  : {tn}")
print(f"    False Positives (false alarms)               : {fp}")
print(f"    False Negatives (missed collisions)          : {fn}")

# ==========================================
# 5. LIVE PREDICTION DEMO
# ==========================================
print("\n[5] Live prediction demo...")
print("    Feeding 3 example car pairs into the trained model:\n")

examples = [
    # [dx,  dy,  distance, dvx,  dvy,  speed1, speed2, heading_diff]
    # Two cars heading directly toward each other at high speed
    [0.5,  0.0,  0.5,     -25.0, 0.0,  28.0,   27.0,   180.0],
    # Two cars moving in parallel -- no risk
    [50.0, 0.0,  50.0,     0.0,  0.0,  20.0,   20.0,   0.0  ],
    # Two cars at intersection -- moderate risk
    [5.0,  5.0,  7.1,    -10.0, -10.0, 15.0,   15.0,   90.0 ],
]

labels = [
    "Head-on at high speed (should be HIGH risk)",
    "Parallel movement    (should be LOW risk) ",
    "Intersection approach(should be MODERATE) ",
]

model.eval()
for i, (ex, label) in enumerate(zip(examples, labels)):
    x_raw  = np.array(ex, dtype=np.float32).reshape(1, -1)
    x_norm = scaler.transform(x_raw)
    x_t    = torch.tensor(x_norm, dtype=torch.float32)
    with torch.no_grad():
        prob = model(x_t).item()
    risk = "HIGH" if prob >= 0.5 else "LOW"
    print(f"    Example {i+1}: {label}")
    print(f"             Collision probability: {round(prob*100, 1)}% -- {risk} RISK")
    print()

print("==========================================")
print(" Phase 4 Training Complete                ")
print("==========================================")
print(" Files saved:                             ")
print("   best_model.pth   -- trained model      ")
print("   collision_data.csv -- training data    ")
print("==========================================")