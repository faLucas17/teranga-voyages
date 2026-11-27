<?php

namespace App\Http\Controllers\Api\Admin;

use App\Http\Controllers\Controller;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Http\JsonResponse;
use Illuminate\Http\Request;

/**
 * Contrôleur CRUD générique du back-office.
 * Les classes filles déclarent le modèle, les règles de validation,
 * les colonnes de recherche et les relations à charger.
 */
abstract class CrudController extends Controller
{
    /** @var class-string<Model> */
    protected string $model;

    /** Colonnes utilisées par le paramètre ?q= */
    protected array $searchable = [];

    /** Relations chargées dans la liste et le détail */
    protected array $with = [];

    /** Filtres exacts autorisés (?status=paid) */
    protected array $filterable = [];

    protected string $defaultSort = 'created_at';

    abstract protected function rules(Request $request, ?Model $model = null): array;

    protected function query(Request $request): Builder
    {
        return $this->model::query()->with($this->with);
    }

    /** Point d'extension pour transformer les données avant enregistrement */
    protected function prepare(array $data, Request $request, ?Model $model = null): array
    {
        return $data;
    }

    public function index(Request $request): JsonResponse
    {
        $query = $this->query($request);

        if ($request->filled('q') && $this->searchable) {
            $term = '%'.$request->string('q').'%';
            $query->where(function (Builder $w) use ($term) {
                foreach ($this->searchable as $column) {
                    $w->orWhereLike($column, $term);
                }
            });
        }

        foreach ($this->filterable as $field) {
            if ($request->filled($field)) {
                $query->where($field, $request->input($field));
            }
        }

        $sort = $request->string('sort', $this->defaultSort)->toString();
        $direction = $request->string('direction', 'desc')->toString() === 'asc' ? 'asc' : 'desc';
        $columns = $query->getModel()->getConnection()->getSchemaBuilder()->getColumnListing($query->getModel()->getTable());
        $query->orderBy(in_array($sort, $columns, true) ? $sort : $this->defaultSort, $direction);

        return response()->json($query->paginate($this->perPage($request, 15)));
    }

    public function show(Request $request, int $id): JsonResponse
    {
        return response()->json($this->query($request)->findOrFail($id));
    }

    public function store(Request $request): JsonResponse
    {
        $data = $this->prepare($request->validate($this->rules($request)), $request);
        $model = $this->model::create($data);

        return response()->json($model->load($this->with), 201);
    }

    public function update(Request $request, int $id): JsonResponse
    {
        $model = $this->model::findOrFail($id);
        $data = $this->prepare($request->validate($this->rules($request, $model)), $request, $model);
        $model->update($data);

        return response()->json($model->fresh($this->with));
    }

    public function destroy(int $id): JsonResponse
    {
        $this->model::findOrFail($id)->delete();

        return response()->json(['message' => 'Élément supprimé.']);
    }
}
