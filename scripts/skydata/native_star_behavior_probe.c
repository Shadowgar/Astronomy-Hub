/* Appended by pytest to unmodified stars.c functions (class registration is
 * omitted so this numeric/lookup binding needs no GL or application runtime).
 * Tile transport, object retention and illuminance are test seams only; the
 * star parser, ERFA propagation, min-order traversal and label rules are real.
 */
void dolog(int level, const char *msg, const char *func,
           const char *file, int line, ...) {}
double core_mag_to_illuminance(double magnitude) { return 1; }
obj_t *obj_retain(const obj_t *obj) { return (obj_t*)obj; }

static int tile_calls, below_minimum, transport_status = 200;
static star_t fixture_star;
static tile_t fixture_tile;
void *hips_get_tile(hips_t *hips, int order, int pix, int flags, int *code)
{
    tile_calls++;
    if (order < 3) below_minimum++;
    if (transport_status != 200) { *code = transport_status; return NULL; }
    if (order == 3 && pix == 447) { *code = 200; return &fixture_tile; }
    *code = 404;
    return NULL;
}
static int found_star(void *user, obj_t *obj) { (*(int*)user)++; return 1; }

extern obj_t *stars_get_by_identity(const char *, const char *, int, int, int *)
    __attribute__((weak));

core_t *core;
static char captured_label[128];
double core_get_hints_mag_offset(const double pos[2]) { return 0; }
const char *skycultures_get_label(const char *id, char *out, int size) { return NULL; }
bool skycultures_fallback_to_international_names(void) { return true; }
void designation_cleanup(const char *name, char *out, int size, int flags)
{ snprintf(out, size, "%s", !strncmp(name, "NAME ", 5) ? name + 5 : name); }
int u8_split_line(char *dst, int len, const char *src, int min_chars) { return 0; }
void labels_add_3d(const char *text, int frame, const double pos[3],
                  bool at_inf, double radius, double size,
                  const double color[4], double angle, int align,
                  int effects, double priority, const obj_t *obj)
{ snprintf(captured_label, sizeof(captured_label), "%s", text); }

int main(int argc, char **argv)
{
    star_t star = {0};
    const char *text = "{\"model_data\":{\"ra\":178.2448649583165,"
        "\"de\":37.71868150264157,\"Vmag\":0,\"BVMag\":0.65,"
        "\"spect_t\":\"G2V\",\"plx\":109.0296,"
        "\"pm_ra\":4002.655,\"pm_de\":-5817.8,\"epoch\":2000}}";
    json_value *args = json_parse(text, strlen(text));
    star_init(&star.obj, args);
    if (!strcmp(argv[1], "color")) {
        printf("%.9g %s\n", star.bv, star.sp_type ? star.sp_type : "missing");
    } else if (!strcmp(argv[1], "unknown")) {
        const char *unknown = "{\"model_data\":{\"ra\":0,\"de\":0,\"Vmag\":1,\"plx\":1}}";
        star_t other = {0};
        json_value *json = json_parse(unknown, strlen(unknown));
        star_init(&other.obj, json);
        printf("%d %.9g\n", isnan(other.bv), other.plx);
    } else if (!strcmp(argv[1], "epoch")) {
        double expected[2][3], actual[3], p[3];
        eraStarpv((float)(178.2448649583165 * DD2R),
                  (float)(37.71868150264157 * DD2R),
                  (float)(4002.655 * ERFA_DMAS2R) / cos((float)(37.71868150264157 * DD2R)),
                  (float)(-5817.8 * ERFA_DMAS2R), (float)(109.0296 / 1000), 0, expected);
        vec3_normalize(expected[0], p); vec3_normalize(star.pvo[0], actual);
        printf("%.17g\n", vec3_dist(p, actual));
    } else if (!strcmp(argv[1], "parallax-boundary")) {
        star_t json_star = {0}, tile_star = {0};
        const double parallax = 1.99999999 / 1000;
        star_set_source(&json_star, 1, 0.5, 1e-5, 2e-5, parallax, 2000, 1, 0.5);
        star_set_source(&tile_star, 1, 0.5, 1e-5, 2e-5, (float)parallax, 2000, 1, 0.5);
        printf("%d\n", json_star.plx == tile_star.plx);
    } else if (!strcmp(argv[1], "search")) {
        hips_t hips = {.order=3, .order_min=3};
        survey_t survey = {.hips=&hips, .min_order=3};
        stars_t stars = {.surveys=&survey};
        int found = 0;
        fixture_tile.nb = 1; fixture_tile.sources = &fixture_star;
        stars_list(&stars.obj, NAN, 0, NULL, &found, found_star);
        printf("%d %d %d\n", found, tile_calls, below_minimum);
    } else if (!strcmp(argv[1], "lookup")) {
        hips_t hips = {.order=3, .order_min=3};
        survey_t survey = {.hips=&hips, .min_order=3, .key="canonical"};
        stars_t stars = {.surveys=&survey};
        int code = -1;
        obj_t *found;
        fixture_tile.nb = 1; fixture_tile.sources = &fixture_star;
        fixture_star.gaia = UINT64_C(4034171629042489088);
        g_stars = &stars;
        if (!stars_get_by_identity) { puts("unavailable"); return 0; }
        found = stars_get_by_identity("canonical", "GAIA 4034171629042489088", 3, 447, &code);
        printf("%d %d %d ", found == &fixture_star.obj, code, tile_calls);
        found = stars_get_by_identity("canonical", "GAIA 4034171629042489089", 3, 447, &code);
        printf("%d %d ", found == NULL, code);
        transport_status = 0;
        found = stars_get_by_identity("canonical", "GAIA 4034171629042489088", 3, 447, &code);
        printf("%d %d ", found == NULL, code);
        found = stars_get_by_identity("canonical", "GAIA 4034171629042489088", 3, -1, &code);
        printf("%d %d\n", found == NULL, code);
    } else if (!strcmp(argv[1], "pending-registration")) {
        stars_t stars = {0};
        int code = -1;
        g_stars = &stars;
        obj_t *found = stars_get_by_identity("canonical", "HIP 32349", 3, 327, &code);
        printf("%d %d %d\n", found == NULL, code, tile_calls);
    } else if (!strcmp(argv[1], "tile")) {
        survey_t survey = {0};
        tile_t *tile = NULL;
        int transparency, i, j;
        long size;
        void *data;
        double difference = 0;
        FILE *file = fopen(argv[2], "rb");
        char json[1024];
        star_t created = {0}, *tiled = NULL;
        fseek(file, 0, SEEK_END); size = ftell(file); rewind(file);
        data = malloc(size); assert(fread(data, 1, size, file) == size); fclose(file);
        assert(eph_load(data, size, USER_PASS(&survey, &tile, &transparency), on_file_tile_loaded) == 0);
        assert(tile && tile->nb == 3);
        for (i = 0; i < tile->nb; i++)
            if (tile->sources[i].hip == 32349) tiled = &tile->sources[i];
        assert(tiled);
        snprintf(json, sizeof(json), "{\"model_data\":{\"ra\":%.17g,\"de\":%.17g,"
            "\"plx\":379.21,\"pm_ra\":%.17g,\"pm_de\":%.17g,"
            "\"epoch\":2000,\"Vmag\":-1.46,\"BVMag\":0.009,\"spect_t\":\"A1V\"}}",
            1.767 * DR2D, -0.291 * DR2D, -2.64e-6 * DR2MAS, -5.93e-6 * DR2MAS);
        args = json_parse(json, strlen(json));
        assert(star_init(&created.obj, args) == 0);
        for (i = 0; i < 2; i++) for (j = 0; j < 3; j++)
            difference = fmax(difference, fabs(created.pvo[i][j] - tiled->pvo[i][j]));
        printf("%.17g %d %d %d %d %d\n", difference,
            created.bv == tiled->bv, created.plx == tiled->plx,
            created.vmag == tiled->vmag, created.epoch == tiled->epoch,
            !strcmp(created.sp_type, tiled->sp_type));
    } else if (!strcmp(argv[1], "missing-magnitude")) {
        const char *json = "{\"model_data\":{\"ra\":0,\"de\":0}}";
        star_t unknown = {0};
        printf("%d\n", star_init(&unknown.obj, json_parse(json, strlen(json))));
    } else if (!strcmp(argv[1], "labels")) {
        core_t engine = {0};
        stars_t stars = {0};
        painter_t painter = {.hints_limit_mag=10};
        double pos[3] = {0}, win[2] = {0}, rgb[3] = {1, 1, 1};
        star_t named = {.vmag=1, .names="HIP 1\0NAME Sirius\0"};
        star_t numeric = {.vmag=1, .names="HIP 2\0"};
        star_t legacy = {.vmag=1, .names="Betelgeuse\0* alf Ori\0"};
        core = &engine; g_stars = &stars;
        star_render_name(&painter, &named, 0, pos, win, 1, rgb);
        printf("%s|", captured_label);
        captured_label[0] = 0;
        star_render_name(&painter, &numeric, 0, pos, win, 1, rgb);
        printf("%s|", captured_label);
        core->selection = &numeric.obj;
        star_render_name(&painter, &numeric, 0, pos, win, 1, rgb);
        printf("%s|", captured_label);
        captured_label[0] = 0; core->selection = NULL;
        star_render_name(&painter, &legacy, 0, pos, win, 1, rgb);
        puts(captured_label);
    }
    return 0;
}
