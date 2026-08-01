# 🫀 ECG Analyzer & AI-Powered Clinical Report Generator

An end-to-end deep learning pipeline for automated 12-lead ECG interpretation with explainable AI (XAI) and deployment-ready inference.

## Overview

This project aims to develop an intelligent ECG analysis system capable of automatically detecting multiple cardiac abnormalities from 12-lead electrocardiograms. The system combines deep learning, explainable AI techniques, and a deployment-oriented software architecture to provide both accurate predictions and interpretable diagnostic reports.

Unlike traditional research notebooks, this project is structured with future deployment in mind, separating model training, inference, report generation, and explainability into reusable components.

---

## Features

- Multi-label ECG classification
- Deep CNN architecture with residual learning/Machine Learning [XGBoost]
- Squeeze-and-Excitation (SE) Attention
- Multi-Head Self Attention
- Automated diagnostic report generation
- Explainable AI (Grad-CAM & SHAP) *(Work in Progress)*
- Deployment-ready inference pipeline
- Modular architecture for API integration

---

## Dataset

**PTB-XL: A Large Publicly Available Electrocardiography Dataset**

- 21,837 clinical 12-lead ECG recordings
- 18,885 patients
- 100 Hz sampling
- Multi-label diagnostic classification

Classes:

- Normal (NORM)
- Myocardial Infarction (MI)
- ST/T Change (STTC)
- Conduction Disturbance (CD)
- Hypertrophy (HYP)

---

## Model Architecture[CNN]

Input ECG
↓
Conv1D Feature Extraction
↓
Residual Blocks
↓
Squeeze-and-Excitation Attention
↓
Multi-Head Self Attention
↓
Global Average Pooling
↓
Dense Layers
↓
Sigmoid Output (Multi-label Classification)

---

## Model Performance

| Metric | Score |
|---------|--------|
| Macro AUROC | **0.9075** |
| Micro AUROC | **0.9259** |
| Macro AUPRC | **0.7722** |
| Macro F1 Score | **0.6758** |

---

## Example Prediction

```text
ECG Analysis Report
------------------------------

Detected Conditions:
✓ ST/T Change (89.7%)
✓ Myocardial Infarction (59.9%)

Other Probabilities:
Hypertrophy                 44.6%
Conduction Disturbance      20.7%
Normal                       0.0%
```

---

## Project Structure

```
ecg-analyzer/
│
├── experiments/
│   ├── training.ipynb
│   ├── inference.ipynb
│   └── xai.ipynb
│
├── models/
│   └── best_model.keras
│
├── data/
│
├── reports/
│
├── app/                 # Future API
│
└── README.md
```

---

## Current Progress

### Completed

- Data preprocessing
- Exploratory Data Analysis
- Deep CNN model
- Residual Learning
- SE Attention
- Multi-Head Attention
- Model training
- Performance evaluation
- Model serialization (.keras)
- Inference pipeline
- Structured prediction output
- Automated report generation

### Work in Progress

- Grad-CAM visualization
- SHAP explanations
- Class-specific threshold optimization
- FastAPI backend
- Frontend interface
- Cloud deployment

---

## Technologies Used

- Python
- TensorFlow / Keras
- NumPy
- Pandas
- Scikit-learn
- Matplotlib
- WFDB
- Google Colab
- Git & GitHub

---

## Future Roadmap

- [ ] Complete Grad-CAM implementation
- [ ] Complete SHAP explanations
- [ ] Optimize class-specific decision thresholds
- [ ] Build REST API using FastAPI
- [ ] Develop interactive web interface
- [ ] Deploy the application
- [ ] Generate downloadable clinical reports
- [ ] Support multiple ECG input formats

---

## Disclaimer

This project is intended for educational and research purposes only and should **not** be used as a substitute for professional medical diagnosis.

---
