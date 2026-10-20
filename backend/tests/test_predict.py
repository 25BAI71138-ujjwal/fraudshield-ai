from ml.predict import get_predictor


def test_predictor_uses_single_worker_for_inference():
    predictor = get_predictor()

    assert predictor.model.n_jobs == 1
